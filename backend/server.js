const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Content directory
const CONTENT_DIR = path.join(__dirname, '../content');

// Navigation structure
const navigation = [
  { id: 'about', title: 'About', description: 'Who I am and what I do' },
  { id: 'blog', title: 'Blog', description: 'Thoughts and writings' },
  { id: 'bookshelf', title: 'Bookshelf', description: 'Books I recommend' },
  { id: 'links', title: 'Links', description: 'Interesting corners of the internet' },
  { id: 'progress', title: 'Progress', description: 'On making things better' },
  { id: 'questions', title: 'Questions', description: 'Things I\'m curious about' }
];

// API Routes

// Get navigation structure
app.get('/api/navigation', (req, res) => {
  res.json(navigation);
});

// Get page content
app.get('/api/content/:page', async (req, res) => {
  const { page } = req.params;
  const filePath = path.join(CONTENT_DIR, `${page}.md`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const htmlContent = marked(content);
    res.json({
      page,
      content: htmlContent,
      rawContent: content
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Page not found' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Get all blog posts metadata
app.get('/api/blog', async (req, res) => {
  const blogDir = path.join(CONTENT_DIR, 'blog');

  try {
    const files = await fs.readdir(blogDir);
    const posts = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(blogDir, file), 'utf-8');
          const lines = content.split('\n');
          const title = lines[0].replace(/^#\s*/, '');
          const date = lines[1]?.replace(/^\*/, '').replace(/\*$/, '').trim() || '';
          const excerpt = lines.slice(3, 6).join(' ').substring(0, 200) + '...';
          return {
            slug: file.replace('.md', ''),
            title,
            date,
            excerpt
          };
        })
    );
    res.json(posts.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    res.json([]);
  }
});

// Get single blog post
app.get('/api/blog/:slug', async (req, res) => {
  const { slug } = req.params;
  const filePath = path.join(CONTENT_DIR, 'blog', `${slug}.md`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const htmlContent = marked(content);
    res.json({ slug, content: htmlContent });
  } catch (error) {
    res.status(404).json({ error: 'Post not found' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
