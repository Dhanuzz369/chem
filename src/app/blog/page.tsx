import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { PostList } from "@/components/PostList";
import { getAllPosts } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Blog: notes on chemicals, grades and trade codes",
  description:
    "Plain answers for buyers of industrial chemicals: HSN codes, surfactant grades, solvent selection and how raw materials are used.",
  path: "/blog",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
];

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <Container className="py-10 md:py-16">
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 max-w-[44rem]">
        <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">Blog</h1>
        <p className="mt-4 max-w-[58ch] text-lg text-ink-muted">
          Plain answers to the questions buyers ask about industrial chemicals: trade codes, grades, selection and
          how each material is used.
        </p>
      </header>

      <div className="mt-10 md:mt-14">
        <PostList posts={posts} label="Posts" />
      </div>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </Container>
  );
}
