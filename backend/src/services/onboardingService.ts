import { AppDataSource } from '../config/database';
import { Candidate } from '../models/Candidate';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingDocument } from '../models/OnboardingDocument';
import { OnboardingTask } from '../models/OnboardingTask';
import { OnboardingState } from '../models/enums/OnboardingState';
import { VerificationStatus, BGVStatus } from '../models/enums/DocumentEnums';
import { TaskStatus } from '../models/enums/TaskStatus';
import onboardingFSMService from './OnboardingFSMService';
import logger from '../utils/logger';

export class OnboardingService {
  private candidateRepo = AppDataSource.getRepository(Candidate);
  private onboardingCaseRepo = AppDataSource.getRepository(OnboardingCase);
  private documentRepo = AppDataSource.getRepository(OnboardingDocument);
  private taskRepo = AppDataSource.getRepository(OnboardingTask);

  async createCandidate(tenantId: string, data: Partial<Candidate>, userId: string): Promise<Candidate> {
    try {
      // Sanitize input: convert empty strings to null for UUID fields
      const sanitizedData = {
        ...data,
        departmentId: data.departmentId && data.departmentId !== '' ? data.departmentId : undefined,
        designationId: data.designationId && data.designationId !== '' ? data.designationId : undefined,
        reportingManagerId: data.reportingManagerId && data.reportingManagerId !== '' ? data.reportingManagerId : undefined,
      };

      // Create candidate
      const candidate = this.candidateRepo.create({
        ...sanitizedData,
        tenantId,
        currentState: OnboardingState.OFFER_APPROVED,
        isActive: true,
      });

      const savedCandidate = await this.candidateRepo.save(candidate);

      // Create onboarding case
      const onboardingCase = this.onboardingCaseRepo.create({
        tenantId,
        candidateId: savedCandidate.candidateId,
        currentState: OnboardingState.OFFER_APPROVED,
        completionPercentage: 0,
        bgvStatus: BGVStatus.NOT_INITIATED,
      });

      await this.onboardingCaseRepo.save(onboardingCase);

      // Auto-create required document placeholders
      await this.createRequiredDocuments(savedCandidate);

      logger.info(`Candidate created: ${savedCandidate.candidateId}`);
      return savedCandidate;
    } catch (error: any) {
      logger.error('Error creating candidate:', error);
      throw new Error(`Failed to create candidate: ${error.message}`);
    }
  }

  private async createRequiredDocuments(candidate: Candidate): Promise<void> {
    const requiredDocs = [
      { documentType: 'appointment_letter', requiresSignature: true, isRequired: true },
      { documentType: 'nda', requiresSignature: true, isRequired: true },
      { documentType: 'code_of_conduct', requiresSignature: true, isRequired: true },
      { documentType: 'it_policy', requiresSignature: true, isRequired: true },
    ];

    for (const docConfig of requiredDocs) {
      const document = this.documentRepo.create({
        tenantId: candidate.tenantId,
        candidateId: candidate.candidateId,
        documentType: docConfig.documentType as any,
        category: 'system_generated' as any,
        fileName: `${docConfig.documentType}_${candidate.candidateId}.pdf`,
        filePath: `/uploads/pending/${docConfig.documentType}_${candidate.candidateId}.pdf`,
        isRequired: docConfig.isRequired,
        requiresSignature: docConfig.requiresSignature,
        isSigned: false,
        verificationStatus: VerificationStatus.PENDING,
      });

      await this.documentRepo.save(document);
      logger.info(`Created document placeholder: ${docConfig.documentType} for candidate ${candidate.candidateId}`);
    }
  }

  async getAllCandidates(tenantId: string, filters?: { state?: string; isActive?: boolean }): Promise<Candidate[]> {
    const query: any = { tenantId };

    if (filters?.state) {
      query.currentState = filters.state;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return this.candidateRepo.find({
      where: query,
      relations: ['department', 'designation', 'reportingManager'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCandidateById(candidateId: string): Promise<Candidate | null> {
    return this.candidateRepo.findOne({
      where: { candidateId },
      relations: ['department', 'designation', 'reportingManager'],
    });
  }

  async sendOffer(candidateId: string, userId: string): Promise<void> {
    const candidate = await this.candidateRepo.findOne({ where: { candidateId } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Transition to OFFER_SENT
    const result = await onboardingFSMService.transition(
      candidateId,
      OnboardingState.OFFER_SENT,
      userId,
      'Offer letter sent to candidate'
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to send offer');
    }

    logger.info(`Offer sent to candidate: ${candidateId}`);
  }

  async acceptOffer(candidateId: string, acceptanceData: { acceptedDate: Date }, userId?: string): Promise<void> {
    const candidate = await this.candidateRepo.findOne({ where: { candidateId } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Update acceptance date
    candidate.offerAcceptedDate = acceptanceData.acceptedDate;
    await this.candidateRepo.save(candidate);

    // Transition to OFFER_ACCEPTED
    // Use userId if provided (for authenticated actions), otherwise use candidateId (for self-service)
    const triggeredBy = userId || candidateId;
    const result = await onboardingFSMService.transition(
      candidateId,
      OnboardingState.OFFER_ACCEPTED,
      triggeredBy,
      'Candidate accepted the offer'
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to record offer acceptance');
    }

    logger.info(`Offer accepted by candidate: ${candidateId}`);
  }

  async uploadDocument(
    candidateId: string,
    file: { fileName: string; filePath: string },
    documentType: string,
    metadata?: Partial<OnboardingDocument>
  ): Promise<OnboardingDocument> {
    const candidate = await this.candidateRepo.findOne({ where: { candidateId } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const document = this.documentRepo.create({
      tenantId: candidate.tenantId,
      candidateId,
      fileName: file.fileName,
      filePath: file.filePath,
      documentType: documentType as any,
      category: 'candidate_upload' as any,
      verificationStatus: VerificationStatus.UPLOADED,
      fileSize: metadata?.fileSize,
      mimeType: metadata?.mimeType,
      ...metadata,
    });

    const savedDocument = await this.documentRepo.save(document);
    logger.info(`Document uploaded: ${savedDocument.documentId} (${file.fileName}, ${metadata?.fileSize} bytes)`);
    return savedDocument;
  }

  async verifyDocument(
    documentId: string,
    verifierId: string,
    status: VerificationStatus,
    notes?: string
  ): Promise<void> {
    const document = await this.documentRepo.findOne({ where: { documentId } });

    if (!document) {
      throw new Error('Document not found');
    }

    document.verificationStatus = status;
    document.verifiedBy = verifierId;
    document.verifiedDate = new Date();
    document.verificationNotes = notes;

    if (status === VerificationStatus.REJECTED && notes) {
      document.rejectionReason = notes;
    }

    await this.documentRepo.save(document);
    logger.info(`Document verified: ${documentId} with status ${status}`);
  }

  async signDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.documentRepo.findOne({ where: { documentId } });

    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.requiresSignature) {
      throw new Error('This document does not require a signature');
    }

    document.isSigned = true;
    document.signedDate = new Date();

    await this.documentRepo.save(document);
    logger.info(`Document signed: ${documentId} by user ${userId}`);
  }

  async getCandidateDocuments(candidateId: string): Promise<OnboardingDocument[]> {
    return this.documentRepo.find({
      where: { candidateId },
      order: { createdAt: 'ASC' },
    });
  }

  async signAllRequiredDocuments(candidateId: string, userId: string): Promise<void> {
    const documents = await this.documentRepo.find({
      where: {
        candidateId,
        requiresSignature: true,
        isSigned: false,
      },
    });

    for (const document of documents) {
      document.isSigned = true;
      document.signedDate = new Date();
      await this.documentRepo.save(document);
      logger.info(`Document auto-signed: ${document.documentId} (${document.documentType})`);
    }

    logger.info(`All required documents signed for candidate ${candidateId} by user ${userId}`);
  }

  async initiateBGV(candidateId: string, bgvData: { vendor: string; referenceId?: string }, userId: string): Promise<void> {
    const onboardingCase = await this.onboardingCaseRepo.findOne({ where: { candidateId } });

    if (!onboardingCase) {
      throw new Error('Onboarding case not found');
    }

    onboardingCase.bgvVendor = bgvData.vendor;
    onboardingCase.bgvReferenceId = bgvData.referenceId;
    onboardingCase.bgvInitiatedDate = new Date();
    onboardingCase.bgvStatus = BGVStatus.IN_PROGRESS;

    await this.onboardingCaseRepo.save(onboardingCase);
    logger.info(`BGV initiated for candidate: ${candidateId}`);
  }

  async updateBGVStatus(candidateId: string, bgvData: Partial<OnboardingCase> & { bgvRemarks?: string }, userId: string): Promise<OnboardingCase> {
    const onboardingCase = await this.onboardingCaseRepo.findOne({ where: { candidateId } });

    if (!onboardingCase) {
      throw new Error('Onboarding case not found');
    }

    // Update BGV fields
    if (bgvData.bgvStatus) {
      onboardingCase.bgvStatus = bgvData.bgvStatus;
    }
    if (bgvData.bgvVendor) {
      onboardingCase.bgvVendor = bgvData.bgvVendor;
    }
    if (bgvData.bgvReferenceId) {
      onboardingCase.bgvReferenceId = bgvData.bgvReferenceId;
    }
    if (bgvData.bgvInitiatedDate) {
      onboardingCase.bgvInitiatedDate = bgvData.bgvInitiatedDate;
    }
    if (bgvData.bgvCompletedDate) {
      onboardingCase.bgvCompletedDate = bgvData.bgvCompletedDate;
    }
    if (bgvData.bgvRemarks) {
      onboardingCase.bgvNotes = bgvData.bgvRemarks;
    }

    if (bgvData.bgvStatus && (bgvData.bgvStatus === BGVStatus.PASSED || bgvData.bgvStatus === BGVStatus.DISCREPANCY || bgvData.bgvStatus === BGVStatus.FAILED)) {
      onboardingCase.bgvCompletedDate = onboardingCase.bgvCompletedDate || new Date();
      onboardingCase.bgvCompleted = true;
    }

    const updated = await this.onboardingCaseRepo.save(onboardingCase);
    logger.info(`BGV status updated for candidate: ${candidateId} by user ${userId}`);
    return updated;
  }

  async getBGVDetails(candidateId: string): Promise<OnboardingCase | null> {
    return this.onboardingCaseRepo.findOne({
      where: { candidateId },
    });
  }

  // ==================== TASK CRUD OPERATIONS ====================

  async createTask(tenantId: string, candidateId: string, taskData: Partial<OnboardingTask>, userId: string): Promise<OnboardingTask> {
    const task = this.taskRepo.create({
      ...taskData,
      tenantId,
      candidateId,
      status: taskData.status || TaskStatus.PENDING,
    });

    const savedTask = await this.taskRepo.save(task);
    logger.info(`Task created: ${savedTask.taskId} for candidate ${candidateId} by user ${userId}`);
    return savedTask;
  }

  async updateTask(taskId: string, taskData: Partial<OnboardingTask>, userId: string): Promise<OnboardingTask> {
    const task = await this.taskRepo.findOne({ where: { taskId } });

    if (!task) {
      throw new Error('Task not found');
    }

    Object.assign(task, taskData);
    const updated = await this.taskRepo.save(task);
    logger.info(`Task updated: ${taskId} by user ${userId}`);
    return updated;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { taskId } });

    if (!task) {
      throw new Error('Task not found');
    }

    await this.taskRepo.remove(task);
    logger.info(`Task deleted: ${taskId} by user ${userId}`);
  }

  // ==================== DOCUMENT CRUD OPERATIONS ====================

  async updateDocument(documentId: string, docData: Partial<OnboardingDocument>, userId: string): Promise<OnboardingDocument> {
    const document = await this.documentRepo.findOne({ where: { documentId } });

    if (!document) {
      throw new Error('Document not found');
    }

    Object.assign(document, docData);
    const updated = await this.documentRepo.save(document);
    logger.info(`Document updated: ${documentId} by user ${userId}`);
    return updated;
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.documentRepo.findOne({ where: { documentId } });

    if (!document) {
      throw new Error('Document not found');
    }

    await this.documentRepo.remove(document);
    logger.info(`Document deleted: ${documentId} by user ${userId}`);
  }

  // ==================== ONBOARDING CASE CRUD OPERATIONS ====================

  async updateOnboardingCase(candidateId: string, caseData: Partial<OnboardingCase>, userId: string): Promise<OnboardingCase> {
    const onboardingCase = await this.onboardingCaseRepo.findOne({ where: { candidateId } });

    if (!onboardingCase) {
      throw new Error('Onboarding case not found');
    }

    Object.assign(onboardingCase, caseData);
    const updated = await this.onboardingCaseRepo.save(onboardingCase);
    logger.info(`Onboarding case updated for candidate: ${candidateId} by user ${userId}`);
    return updated;
  }

  async getOnboardingCase(candidateId: string): Promise<OnboardingCase | null> {
    return this.onboardingCaseRepo.findOne({
      where: { candidateId },
    });
  }

  async markJoined(candidateId: string, actualJoinDate: Date, userId: string): Promise<void> {
    const candidate = await this.candidateRepo.findOne({ where: { candidateId } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    candidate.actualJoinDate = actualJoinDate;
    await this.candidateRepo.save(candidate);

    // Transition to JOINED
    const result = await onboardingFSMService.transition(
      candidateId,
      OnboardingState.JOINED,
      userId,
      'Candidate joined the organization'
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to mark as joined');
    }

    logger.info(`Candidate joined: ${candidateId}`);
  }

  async getOnboardingPipeline(tenantId: string): Promise<Record<string, number>> {
    const pipeline: Record<string, number> = {};

    const states = Object.values(OnboardingState);

    for (const state of states) {
      const count = await this.candidateRepo.count({
        where: { tenantId, currentState: state, isActive: true },
      });
      pipeline[state] = count;
    }

    return pipeline;
  }

  async completeTask(taskId: string, userId: string, notes?: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { taskId } });

    if (!task) {
      throw new Error('Task not found');
    }

    task.status = TaskStatus.COMPLETED;
    task.completedDate = new Date();
    task.completedBy = userId;
    task.completionNotes = notes;

    await this.taskRepo.save(task);
    logger.info(`Task completed: ${taskId}`);
  }

  async getCandidateTasks(candidateId: string): Promise<OnboardingTask[]> {
    return this.taskRepo.find({
      where: { candidateId },
      order: { dueDate: 'ASC' },
    });
  }

  async getStateTransitionHistory(candidateId: string): Promise<any[]> {
    const StatusTransition = AppDataSource.getRepository('StatusTransition');
    return StatusTransition.find({
      where: { candidateId },
      order: { transitionDate: 'DESC' },
      take: 50,
    });
  }

  async updateCandidate(candidateId: string, data: Partial<Candidate>, userId: string): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({ where: { candidateId } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Update fields
    Object.assign(candidate, data);
    const updated = await this.candidateRepo.save(candidate);

    logger.info(`Candidate updated: ${candidateId} by user ${userId}`);
    return updated;
  }

  async generateAndSignRequiredDocuments(candidateId: string, userId: string): Promise<void> {
    const candidate = await this.candidateRepo.findOne({ where: { candidateId } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const requiredDocs = [
      { documentType: 'appointment_letter', requiresSignature: true, isRequired: true },
      { documentType: 'nda', requiresSignature: true, isRequired: true },
      { documentType: 'code_of_conduct', requiresSignature: true, isRequired: true },
      { documentType: 'it_policy', requiresSignature: true, isRequired: true },
    ];

    for (const docConfig of requiredDocs) {
      // Find or create the document
      let document = await this.documentRepo.findOne({
        where: {
          candidateId: candidate.candidateId,
          tenantId: candidate.tenantId,
          documentType: docConfig.documentType as any,
        },
      });

      if (!document) {
        // Create if doesn't exist
        document = this.documentRepo.create({
          tenantId: candidate.tenantId,
          candidateId: candidate.candidateId,
          documentType: docConfig.documentType as any,
          category: 'system_generated' as any,
          fileName: `${docConfig.documentType}_${candidate.candidateId}.pdf`,
          filePath: `/uploads/generated/${docConfig.documentType}_${candidate.candidateId}.pdf`,
          isRequired: docConfig.isRequired,
          requiresSignature: docConfig.requiresSignature,
          isSigned: true,
          signedDate: new Date(),
          verificationStatus: VerificationStatus.VERIFIED,
        });
      } else {
        // Update existing document
        document.isSigned = true;
        document.signedDate = new Date();
        document.verificationStatus = VerificationStatus.VERIFIED;
        document.filePath = `/uploads/generated/${docConfig.documentType}_${candidate.candidateId}.pdf`;
      }

      await this.documentRepo.save(document);
      logger.info(`Generated and signed document: ${docConfig.documentType} for candidate ${candidateId}`);
    }

    logger.info(`All required documents generated and signed for candidate ${candidateId} by user ${userId}`);
  }
}

export default new OnboardingService();
