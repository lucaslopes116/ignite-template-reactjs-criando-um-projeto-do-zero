import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <img src="/logo.svg" alt="logo" />
    </header>
  );
}
