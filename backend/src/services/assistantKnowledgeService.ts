import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { AURORA_APPLICATION_KNOWLEDGE } from '../assistant/applicationKnowledge';
import { ManuKnowledgeCitation, ManuScreenContext } from '../assistant/types';
import { UserRole } from '../../../shared/types';

interface KnowledgeRequest {
  tenantId: string;
  role: UserRole;
  query: string;
  screen?: ManuScreenContext;
  includeAcvDocuments: boolean;
  limit?: number;
}

interface DocumentChunk {
  id: string;
  title: string;
  section: string;
  sourcePath: string;
  content: string;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'how',
  'i', 'in', 'is', 'it', 'me', 'of', 'on', 'or', 'our', 'the', 'this', 'to', 'what',
  'when', 'where', 'which', 'with', 'you',
]);

const tokenize = (value: string) =>
  Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9/.-]+/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    )
  );

const compact = (value: string, max = 420) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
};

class AssistantKnowledgeService {
  private tenantRepo = AppDataSource.getRepository(Tenant);
  private acvChunks: DocumentChunk[] | null = null;

  async retrieve(request: KnowledgeRequest): Promise<ManuKnowledgeCitation[]> {
    const terms = tokenize(
      `${request.query} ${request.screen?.pageTitle || ''} ${request.screen?.pathname || ''} ${request.screen?.activeTab || ''}`
    );
    const application = this.rankApplicationKnowledge(terms, request);
    let acv: ManuKnowledgeCitation[] = [];

    if (request.includeAcvDocuments && (await this.isAcvTenant(request.tenantId))) {
      acv = this.rankDocumentChunks(terms, this.loadAcvChunks());
    }

    return [...application, ...acv]
      .sort((left, right) => right.score - left.score)
      .slice(0, request.limit || 5);
  }

  resetCache() {
    this.acvChunks = null;
  }

  private async isAcvTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findOne({ where: { tenantId } });
    return Boolean(tenant && /\bacv\b/i.test(tenant.companyName));
  }

  private rankApplicationKnowledge(
    terms: string[],
    request: KnowledgeRequest
  ): ManuKnowledgeCitation[] {
    const role = String(request.role);
    return AURORA_APPLICATION_KNOWLEDGE
      .filter((entry) => entry.roles.includes(role))
      .map((entry) => {
        const titleTerms = tokenize(`${entry.title} ${entry.section} ${entry.keywords.join(' ')}`);
        const contentTerms = tokenize(entry.content);
        const titleOverlap = terms.filter((term) => titleTerms.includes(term)).length;
        const contentOverlap = terms.filter((term) => contentTerms.includes(term)).length;
        const routeBoost =
          entry.route && request.screen?.pathname?.startsWith(entry.route) ? 2.5 : 0;
        const score = titleOverlap * 3 + contentOverlap + routeBoost;
        return {
          id: `application:${entry.id}`,
          title: entry.title,
          section: entry.section,
          sourceType: 'application' as const,
          excerpt: compact(entry.content),
          score,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }

  private rankDocumentChunks(
    terms: string[],
    chunks: DocumentChunk[]
  ): ManuKnowledgeCitation[] {
    return chunks
      .map((chunk) => {
        const headingTerms = tokenize(`${chunk.title} ${chunk.section} ${chunk.sourcePath}`);
        const contentTerms = tokenize(chunk.content);
        const headingOverlap = terms.filter((term) => headingTerms.includes(term)).length;
        const contentOverlap = terms.filter((term) => contentTerms.includes(term)).length;
        const score = headingOverlap * 4 + contentOverlap;
        return {
          id: `acv:${chunk.id}`,
          title: chunk.title,
          section: chunk.section,
          sourceType: 'acv_document' as const,
          sourcePath: chunk.sourcePath,
          excerpt: compact(chunk.content),
          score,
        };
      })
      .filter((entry) => entry.score >= 2)
      .sort((left, right) => right.score - left.score)
      .slice(0, 4);
  }

  private loadAcvChunks() {
    if (this.acvChunks) return this.acvChunks;

    const docsRoot = this.resolveAcvDocsRoot();
    if (!docsRoot) {
      this.acvChunks = [];
      return this.acvChunks;
    }

    const files = this.walkMarkdownFiles(docsRoot);
    this.acvChunks = files.flatMap((filePath) => this.chunkMarkdown(filePath, docsRoot));
    return this.acvChunks;
  }

  private resolveAcvDocsRoot() {
    const candidates = [
      path.resolve(process.cwd(), 'docs/acv-implementation'),
      path.resolve(process.cwd(), '../docs/acv-implementation'),
      path.resolve(__dirname, '../../../docs/acv-implementation'),
      path.resolve(__dirname, '../../../../docs/acv-implementation'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
  }

  private walkMarkdownFiles(root: string) {
    const results: string[] = [];
    const visit = (directory: string) => {
      fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.')) visit(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
          results.push(fullPath);
        }
      });
    };
    visit(root);
    return results;
  }

  private chunkMarkdown(filePath: string, root: string): DocumentChunk[] {
    const sourcePath = path.posix.join(
      'docs/acv-implementation',
      path.relative(root, filePath).split(path.sep).join(path.posix.sep)
    );
    const raw = fs.readFileSync(filePath, 'utf8').slice(0, 250_000);
    const lines = raw.split(/\r?\n/);
    const title = lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim()
      || path.basename(filePath, '.md').replace(/-/g, ' ');
    const chunks: DocumentChunk[] = [];
    let section = 'Overview';
    let buffer: string[] = [];

    const flush = () => {
      const content = buffer.join('\n').trim();
      if (content.length >= 40) {
        const pieces = content.match(/[\s\S]{1,1200}(?:\n|$)/g) || [content];
        pieces.forEach((piece, index) => {
          chunks.push({
            id: `${sourcePath}:${chunks.length + index}`,
            title,
            section,
            sourcePath,
            content: piece.trim(),
          });
        });
      }
      buffer = [];
    };

    lines.forEach((line) => {
      const heading = line.match(/^#{1,4}\s+(.+)/);
      if (heading) {
        flush();
        section = heading[1].trim();
        return;
      }
      if (!/^```/.test(line)) buffer.push(line);
    });
    flush();
    return chunks;
  }
}

export const assistantKnowledgeService = new AssistantKnowledgeService();
export default assistantKnowledgeService;
