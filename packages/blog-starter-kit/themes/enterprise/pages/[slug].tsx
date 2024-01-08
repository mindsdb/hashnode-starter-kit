import { addArticleJsonLd } from '@starter-kit/utils/seo/addArticleJsonLd';
import { getAutogeneratedPostOG } from '@starter-kit/utils/social/og';
import request from 'graphql-request';
import { GetStaticPaths, GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import ErrorPage from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from '../components/container';
import { AppProvider } from '../components/contexts/appContext';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { Layout } from '../components/layout';
import { MarkdownToHtml } from '../components/markdown-to-html';
import { PostHeader } from '../components/post-header';
import { PostTOC } from '../components/post-toc';
import {
	PageByPublicationDocument,
	PageByPublicationQuery,
	PageByPublicationQueryVariables,
	PostFullFragment,
	PublicationFragment,
	SinglePostByPublicationDocument,
	SinglePostByPublicationQuery,
	SinglePostByPublicationQueryVariables,
	SlugPostsByPublicationDocument,
	SlugPostsByPublicationQuery,
	SlugPostsByPublicationQueryVariables,
	StaticPageFragment,
} from '../generated/graphql';

const AboutAuthor = dynamic(() => import('../components/about-author'), { ssr: false });
const Subscribe = dynamic(() => import('../components/subscribe').then((mod) => mod.Subscribe));
const PostComments = dynamic(() =>
	import('../components/post-comments').then((mod) => mod.PostComments),
);

type Props =
	| {
			post: PostFullFragment;
			page: null;
			publication: PublicationFragment;
	  }
	| {
			post: null;
			page: StaticPageFragment;
			publication: PublicationFragment;
	  };

const Post = (publication: PublicationFragment, post: PostFullFragment) => {
	const highlightJsMonokaiTheme =
		'.hljs{display:block;overflow-x:auto;padding:.5em;background:#23241f}.hljs,.hljs-subst,.hljs-tag{color:#f8f8f2}.hljs-emphasis,.hljs-strong{color:#a8a8a2}.hljs-bullet,.hljs-link,.hljs-literal,.hljs-number,.hljs-quote,.hljs-regexp{color:#ae81ff}.hljs-code,.hljs-section,.hljs-selector-class,.hljs-title{color:#a6e22e}.hljs-strong{font-weight:700}.hljs-emphasis{font-style:italic}.hljs-attr,.hljs-keyword,.hljs-name,.hljs-selector-tag{color:#f92672}.hljs-attribute,.hljs-symbol{color:#66d9ef}.hljs-class .hljs-title,.hljs-params{color:#f8f8f2}.hljs-addition,.hljs-built_in,.hljs-builtin-name,.hljs-selector-attr,.hljs-selector-id,.hljs-selector-pseudo,.hljs-string,.hljs-template-variable,.hljs-type,.hljs-variable{color:#e6db74}.hljs-comment,.hljs-deletion,.hljs-meta{color:#75715e}';

	const tagsList = (post.tags ?? []).map((tag) => (
		<li key={tag.id}>
			<Link
				href={`/tag/${tag.slug}`}
				className="block rounded-full border px-2 py-1 font-medium hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800 md:px-4"
			>
				#{tag.slug}
			</Link>
		</li>
	));

	return (
		<>
			<Head>
				<title>{post.seo?.title || post.title}</title>
				<link rel="canonical" href={post.url} />
				<meta name="description" content={post.seo?.description || post.subtitle || post.brief} />
				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:title" content={post.seo?.title || post.title} />
				<meta
					property="twitter:description"
					content={post.seo?.description || post.subtitle || post.brief}
				/>
				<meta
					property="og:image"
					content={
						post.ogMetaData?.image ||
						post.coverImage?.url ||
						getAutogeneratedPostOG(post, publication)
					}
				/>
				<meta
					property="twitter:image"
					content={
						post.ogMetaData?.image ||
						post.coverImage?.url ||
						getAutogeneratedPostOG(post, publication)
					}
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(addArticleJsonLd(publication, post)),
					}}
				/>
				<style dangerouslySetInnerHTML={{ __html: highlightJsMonokaiTheme }}></style>
			</Head>
			<PostHeader
				title={post.title}
				coverImage={post.coverImage?.url}
				date={post.publishedAt}
				author={post.author}
			/>
			{post.features.tableOfContents.isEnabled && <PostTOC />}
			<MarkdownToHtml contentMarkdown={post.content.markdown} />
			{(post.tags ?? []).length > 0 && (
				<div className="mx-auto w-full px-5 text-slate-600 dark:text-neutral-300 md:max-w-screen-md">
					<ul className="flex flex-row flex-wrap items-center gap-2">{tagsList}</ul>
				</div>
			)}
			<AboutAuthor />
			{!post.preferences.disableComments && post.comments.totalDocuments > 0 && <PostComments />}
			<Subscribe />
		</>
	);
};

const Page = (page: StaticPageFragment) => {
	const title = page.title;
	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>
			<MarkdownToHtml contentMarkdown={page.content.markdown} />
		</>
	);
};

export default function PostOrPage({ publication, post, page }: Props) {
	if (!post && !page) {
		return <ErrorPage statusCode={404} />;
	}

	return (
		<AppProvider publication={publication} post={post}>
			<Layout>
				<Header />
				<Container className="pt-10">
					<article className="flex flex-col items-start gap-10 pb-10">
						{post ? Post(publication, post) : Page(page)}
					</article>
				</Container>
				<Footer />
			</Layout>
		</AppProvider>
	);
}

type Params = {
	slug: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
	if (!params) {
		throw new Error('No params');
	}
	const data = await request<SinglePostByPublicationQuery, SinglePostByPublicationQueryVariables>(
		process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
		SinglePostByPublicationDocument,
		{
			host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
			slug: params.slug,
		},
	);

	// Extract the post data from the GraphQL response
	const publication = data.publication;
	if (!publication) {
		return {
			notFound: true,
		};
	}
	const post = publication.post;
	if (!post) {
		const staticPageData = await request<PageByPublicationQuery, PageByPublicationQueryVariables>(
			process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
			PageByPublicationDocument,
			{
				host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
				slug: params.slug,
			},
		);

		const page = staticPageData.publication?.staticPage;
		if (!page) {
			return {
				notFound: true,
			};
		}
		return {
			props: {
				post: null,
				page,
				publication,
			},
			revalidate: 1,
		};
	}

	return {
		props: {
			post,
			page: null,
			publication,
		},
		revalidate: 1,
	};
};

export const getStaticPaths: GetStaticPaths = async () => {
	const data = await request<SlugPostsByPublicationQuery, SlugPostsByPublicationQueryVariables>(
		process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
		SlugPostsByPublicationDocument,
		{
			first: 10,
			host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
		},
	);

	const postSlugs = (data.publication?.posts.edges ?? []).map((edge) => edge.node.slug);

	return {
		paths: postSlugs.map((slug) => {
			return {
				params: {
					slug: slug,
				},
			};
		}),
		fallback: 'blocking',
	};
};
