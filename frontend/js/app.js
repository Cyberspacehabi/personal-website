// Personal Website App
class PersonalSite {
  constructor() {
    this.contentEl = document.getElementById('content');
    this.navEl = document.getElementById('navigation');
    this.currentPage = null;
    this.init();
  }

  async init() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Load navigation
    await this.loadNavigation();

    // Handle initial route
    this.handleRoute();

    // Listen for browser navigation
    window.addEventListener('popstate', () => this.handleRoute());
  }

  async loadNavigation() {
    try {
      const response = await fetch('/api/navigation');
      const navItems = await response.json();

      const navList = this.navEl.querySelector('.nav-list');
      navList.innerHTML = navItems.map(item => `
        <li>
          <a href="/${item.id}" data-page="${item.id}" title="${item.description}">${item.title}</a>
        </li>
      `).join('');

      // Add click handlers for navigation
      navList.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.dataset.page) {
          e.preventDefault();
          this.navigateTo(e.target.dataset.page);
        }
      });
    } catch (error) {
      console.error('Failed to load navigation:', error);
    }
  }

  navigateTo(page) {
    history.pushState({ page }, '', `/${page}`);
    this.loadPage(page);
    this.updateActiveNav(page);
  }

  handleRoute() {
    const path = window.location.pathname;

    if (path === '/' || path === '') {
      this.showHome();
      this.updateActiveNav(null);
    } else if (path.startsWith('/blog/')) {
      const slug = path.replace('/blog/', '');
      this.loadBlogPost(slug);
      this.updateActiveNav('blog');
    } else {
      const page = path.replace('/', '');
      this.loadPage(page);
      this.updateActiveNav(page);
    }
  }

  updateActiveNav(activePage) {
    const links = this.navEl.querySelectorAll('a');
    links.forEach(link => {
      link.classList.toggle('active', link.dataset.page === activePage);
    });
  }

  showHome() {
    this.contentEl.innerHTML = `
      <div class="home-intro">
        <p>Welcome. I'm a [your profession] based in [your location].</p>
        <p>This site is a collection of my thoughts, projects, and interests.
           Feel free to explore using the navigation above.</p>
        <p>You can learn more <a href="/about" data-page="about">about me</a>,
           read my <a href="/blog" data-page="blog">blog</a>,
           or see what <a href="/projects" data-page="projects">projects</a> I'm working on.</p>
      </div>
    `;

    // Add click handlers for internal links
    this.contentEl.querySelectorAll('a[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(link.dataset.page);
      });
    });

    this.currentPage = null;
  }

  async loadPage(page) {
    this.currentPage = page;
    this.contentEl.innerHTML = '<p class="loading">Loading...</p>';

    // Special handling for blog index
    if (page === 'blog') {
      await this.loadBlogIndex();
      return;
    }

    try {
      const response = await fetch(`/api/content/${page}`);

      if (!response.ok) {
        throw new Error('Page not found');
      }

      const data = await response.json();
      this.contentEl.innerHTML = `<div class="content">${data.content}</div>`;
    } catch (error) {
      this.contentEl.innerHTML = `
        <div class="error">
          <p>This page doesn't exist yet.</p>
          <p>Create a file at <code>content/${page}.md</code> to add content here.</p>
        </div>
      `;
    }
  }

  async loadBlogIndex() {
    try {
      const response = await fetch('/api/blog');
      const posts = await response.json();

      if (posts.length === 0) {
        this.contentEl.innerHTML = `
          <div class="content">
            <h1>Blog</h1>
            <p>No posts yet. Add markdown files to <code>content/blog/</code> to create posts.</p>
          </div>
        `;
        return;
      }

      this.contentEl.innerHTML = `
        <div class="content">
          <h1>Blog</h1>
          <ul class="blog-list">
            ${posts.map(post => `
              <li>
                <h2 class="post-title">
                  <a href="/blog/${post.slug}" data-blog="${post.slug}">${post.title}</a>
                </h2>
                <div class="post-date">${post.date}</div>
                <p class="post-excerpt">${post.excerpt}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

      // Add click handlers for blog links
      this.contentEl.querySelectorAll('a[data-blog]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          history.pushState({ blog: link.dataset.blog }, '', `/blog/${link.dataset.blog}`);
          this.loadBlogPost(link.dataset.blog);
        });
      });
    } catch (error) {
      this.contentEl.innerHTML = '<p class="error">Failed to load blog posts.</p>';
    }
  }

  async loadBlogPost(slug) {
    this.contentEl.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const response = await fetch(`/api/blog/${slug}`);

      if (!response.ok) {
        throw new Error('Post not found');
      }

      const data = await response.json();
      this.contentEl.innerHTML = `
        <a href="/blog" class="back-link" data-page="blog">Back to blog</a>
        <div class="content">${data.content}</div>
      `;

      // Add click handler for back link
      this.contentEl.querySelector('.back-link').addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('blog');
      });
    } catch (error) {
      this.contentEl.innerHTML = '<p class="error">Post not found.</p>';
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new PersonalSite();
});
