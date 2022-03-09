import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { Document } from '@prismicio/client/types/documents';
import Link from 'next/link';
import { useState } from 'react';
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

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const jsonResponse = (await response.json()) as ApiSearchResponse;

    const newPosts = jsonResponse.results.map((post: Document) => ({
      uid: post.uid,
      first_publication_date:
        format(new Date(post.first_publication_date), 'dd MMM yyyy', {
          locale: ptBR,
        }) ?? 'Sem data disponível',
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setNextPage(jsonResponse.next_page);
  }

  return (
    <div className={commonStyles.container}>
      {posts.map((post, i) => {
        return (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <div className={commonStyles.posts}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <FiCalendar /> {post.first_publication_date}
                </time>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      {nextPage && (
        <button
          onClick={handleMorePosts}
          className={commonStyles.btnCarregarMais}
          type="button"
        >
          Carregar mais posts
        </button>
      )}
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
        'posts.heading',
        'posts.body',
      ],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(
    ({ uid, last_publication_date, data }: Post) => {
      return {
        uid,
        first_publication_date:
          format(new Date(last_publication_date), 'dd MMM yyyy', {
            locale: ptBR,
          }) ?? 'Sem data disponível',
        data: {
          title: data.title,
          subtitle: data.subtitle,
          author: data.author,
        },
      };
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 5, // 5min
  };
};
