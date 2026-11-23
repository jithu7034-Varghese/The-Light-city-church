// Home page: the published CMS page "home".
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getPublishedPage } from "@/cms/queries";
import { PageSections, pageMetadata } from "@/cms/render";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPublishedPage("home"), "/");
}

export default async function HomePage() {
  const page = await getPublishedPage("home");
  if (!page) notFound();
  return (
    <div className={styles.container}>
      <PageSections page={page} />
    </div>
  );
}
