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

      logger.info(`Candidate created: ${savedCandidate.candidateId}`);
      return savedCandidate;
    } catch (error: any) {
      logger.error('Error creating candidate:', error);
      throw new Error(`Failed to create candidate: ${error.message}`);
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
      ...metadata,
    });

    const savedDocument = await this.documentRepo.save(document);
    logger.info(`Document uploaded: ${savedDocument.documentId}`);
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

  async updateBGVStatus(candidateId: string, status: BGVStatus, notes?: string): Promise<void> {
    const onboardingCase = await this.onboardingCaseRepo.findOne({ where: { candidateId } });

    if (!onboardingCase) {
      throw new Error('Onboarding case not found');
    }

    onboardingCase.bgvStatus = status;
    onboardingCase.bgvNotes = notes;

    if (status === BGVStatus.PASSED || status === BGVStatus.DISCREPANCY || status === BGVStatus.FAILED) {
      onboardingCase.bgvCompletedDate = new Date();
      onboardingCase.bgvCompleted = true;
    }

    await this.onboardingCaseRepo.save(onboardingCase);
    logger.info(`BGV status updated for candidate: ${candidateId} to ${status}`);
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
}

export default new OnboardingService();
