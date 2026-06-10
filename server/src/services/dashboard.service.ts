// Path: src/services/dashboard.service.ts
import { Project } from '../models/project.model.js';
import { Skill } from '../models/skill.model.js';
import { Article } from '../models/article.model.js';
import { Contact } from '../models/contact.model.js';

export interface IRecentEntry {
  id: string;
  resource: 'projects' | 'skills' | 'articles' | 'messages';
  title: string;
  status: string;
  createdAt: Date;
}

export const dashboardService = {
  async getOverviewStats() {
    const [
      projectsCount, skillsCount, articlesCount, unreadMessagesCount,
      recentProjects, recentSkills, recentArticles, recentMessages
    ] = await Promise.all([
      Project.countDocuments(),
      Skill.countDocuments(),
      Article.countDocuments({ isPublished: true }),
      Contact.countDocuments({ isRead: false }),
      Project.find().sort({ createdAt: -1 }).limit(5).lean(),
      Skill.find().sort({ createdAt: -1 }).limit(5).lean(),
      Article.find().sort({ createdAt: -1 }).limit(5).lean(),
      Contact.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const recentEntries: IRecentEntry[] = [
      ...recentProjects.map(p => ({
        id: (p._id as any).toString(),
        resource: 'projects' as const,
        title: p.title as string,
        status: p.isPublished ? 'published' : 'draft',
        createdAt: p.createdAt as Date
      })),
      ...recentSkills.map(s => ({
        id: (s._id as any).toString(),
        resource: 'skills' as const,
        title: s.name as string,
        status: s.isPublished ? 'published' : 'draft',
        createdAt: s.createdAt as Date
      })),
      ...recentArticles.map(a => ({
        id: (a._id as any).toString(),
        resource: 'articles' as const,
        title: a.title as string,
        status: a.isPublished ? 'published' : 'draft',
        createdAt: a.createdAt as Date
      })),
      ...recentMessages.map(m => ({
        id: (m._id as any).toString(),
        resource: 'messages' as const,
        title: `Message from ${m.name}`,
        status: m.isRead ? 'read' : 'unread',
        createdAt: m.createdAt as Date
      }))
    ];

    recentEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const topRecent = recentEntries.slice(0, 5);

    return {
      counts: {
        projects: projectsCount,
        skills: skillsCount,
        articles: articlesCount,
        messages: unreadMessagesCount
      },
      recentEntries: topRecent
    };
  }
};
