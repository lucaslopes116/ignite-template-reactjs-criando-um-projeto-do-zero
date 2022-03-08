import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ posts, postsPagination }) {
  console.log('1', posts);
  console.log('2', postsPagination);

  return (
    <div className={commonStyles.container}>
      {posts.map(post => {
        return (
          <div className={commonStyles.posts}>
            <h1>{post.title}</h1>
            <p>{post.subtitle}</p>
            <div>
              <time>{post.first_publication_date}</time>
              <span>{post.author}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [
        'posts.uid',
        'posts.title',
        'posts.subtitle',
        'posts.author',
        'posts.banner',
        'posts.content',
        'posts.heading',
        'posts.body',
      ],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(
    ({ uid, last_publication_date, data }: Post) => {
      return {
        slug: uid,
        first_publication_date:
          new Date(last_publication_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }) ?? first_publication_date,
        title: data.title,
        subtitle: data.subtitle,
        author: data.author,
        banner: data.banner,
        content: data.content,
      };
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      posts,
      postsPagination,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
