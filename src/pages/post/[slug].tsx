import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date?: string | null;
  last_publication_date?: string | null;
  uid?: string;
  data: {
    title: string;
    subtitle?: string;
    banner?: {
      url: string;
    };
    author?: string;
    content?: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const wordsPerMinute = 200;
  const totalWords = Math.round(
    post.data.content.reduce(
      (acc, contentItem) =>
        acc +
        contentItem.heading.toString().split(' ').length +
        contentItem.body.toString().split(' ').length,

      0
    )
  );

  const totalMinutes = Math.ceil(totalWords / wordsPerMinute);

  return (
    <main className={styles.container}>
      <img className={styles.banner} src={post.data.banner.url} alt="Banner" />
      <article>
        <h1>{post.data.title}</h1>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <FiCalendar size={20} />
            <span>{post.first_publication_date}</span>
          </div>
          <div className={styles.infoItem}>
            <FiUser size={20} />
            <span>{post.data.author}</span>
          </div>
          <div className={styles.infoItem}>
            <FiClock size={20} />
            <span>{totalMinutes} min</span>
          </div>
        </div>
        {post.data.content.map(item => {
          return (
            <div
              className={styles.postContent}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: item.body,
              }}
            />
          );
        })}
      </article>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [],
      pageSize: 100,
    }
  );

  return {
    paths: response.results.map(post => ({
      params: { slug: post.uid },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData = {},
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      post: {
        uid: response.uid,
        first_publication_date: format(
          new Date(response.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        last_publication_date: response.last_publication_date,
        data: {
          author: response.data.author,
          title: response.data.title,
          subtitle: response.data.subtitle,
          content: response.data.content,
          banner: {
            url: response.data.banner.url,
          },
        },
      },
    },
    revalidate: 60 * 5, // 5min
  };
};
