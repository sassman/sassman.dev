<script context="module">
  export async function preload({ params, query }) {
    // will call GET /blog/index.json.ts
    const response = await this.fetch(`blog.json`);
    return { posts: await response.json() };
  }
</script>

<script>
  import moment from 'moment'

  export let posts;

  function formatDate(date) {
    return moment(date).fromNow();
  }
</script>

<style lang="scss">
  .post {
    padding: 1.5rem 0;

    a {
      text-decoration: none;
      &:hover {
        color: #000;
        text-shadow: #454954 0 0 1px;
      }
    }

    h1 {
      margin-bottom: 0;
    }
    p {
      margin: 0.75rem 0.25rem;
    }
  }
  .read-more {
    padding: 0.5rem 1.5rem;
    border: 1px solid #454954;
    border-radius: 2px;
    &:hover {
      border-color: #000;
      box-shadow: #454954 0 0 1px;
    }
  }
  .meta {
    padding: 0;
    margin: 0;
    font-size: 75%;
    color: #999;
  }
  .tag {
  }
  .tag::before {
    content: '#';
  }
  .tag::after {
    content: ' ';
  }
</style>

<h2>Recent posts:</h2>

<div class="posts">
  {#each posts as post}
    <!-- we're using the non-standard `rel=prefetch` attribute to
        tell Sapper to load the data for the page as soon as
        the user hovers over the link or taps it, instead of
        waiting for the 'click' event -->
    <div class="post">
      <div class="meta">
        {#each post.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
      <h1>
        <a rel="prefetch" hreflang="en" href="blog/{post.slug}">{post.title}</a>
      </h1>
      <div class="meta">
        <span class="date">{formatDate(post.date)}</span>
      </div>
      <p>
        {@html post.excerptHtml}
      </p>
      <div>
        <a class="read-more" hreflang="en" href="blog/{post.slug}">Continue reading »</a>
      </div>
    </div>
  {/each}
</div>
