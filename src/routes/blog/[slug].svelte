<script context="module">
  // the (optional) preload function takes a
  // `{ path, params, query }` object and turns it into
  // the data we need to render the page
  export async function preload(page, session) {
    // the `slug` parameter is available because this file
    // is called [slug].svelte
    const { slug } = page.params;

    // `this.fetch` is a wrapper around `fetch` that allows
    // you to make authenticated requests on both
    // server and client
    const res = await this.fetch(`blog/${slug}.json`);
    const article = await res.json();

    if (res.status === 200 && article) {
      return { article };
    }
    this.error(res.status, data.message);
  }
</script>

<script>
  // make article available to the outer controls
  export let article;
</script>

<style lang="scss">
</style>

<!-- src/routes/blog/[slug].svelte -->
<svelte:head>
  <title>{article.title}</title>
</svelte:head>

<h1>{article.title}</h1>

<div class="content">
  {@html article.contentHtml}
</div>
