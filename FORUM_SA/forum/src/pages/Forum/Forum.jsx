import { useState } from "react";
import {
  FaBookOpen,
  FaQuestionCircle,
  FaBullhorn,
  FaUsers,
  FaComments,
} from "react-icons/fa";
import {
  FiSearch,
  FiBell,
  FiChevronDown,
  FiPlus,
  FiLogOut,
} from "react-icons/fi";
import styles from "./Forum.module.css";

const categories = [
  {
    id: 1,
    name: "Materiais de Estudo",
    description: "Compartilhe PDFs, resumos, mapas mentais e provas",
    icon: <FaBookOpen />,
  },
  {
    id: 2,
    name: "Perguntas & Respostas",
    description: "Tire dúvidas e ajude outros colegas",
    icon: <FaQuestionCircle />,
  },
  {
    id: 3,
    name: "Notícias de Concursos",
    description: "Fique por dentro das últimas novidades",
    icon: <FaBullhorn />,
  },
  {
    id: 4,
    name: "Networking & Grupos",
    description: "Encontre parceiros de estudo",
    icon: <FaUsers />,
  },
  {
    id: 5,
    name: "Motivação & Bate-papo",
    description: "Compartilhe experiências e motivação",
    icon: <FaComments />,
  },
];

export default function Forum() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  return (
    <div className={styles.forum}>
      <div className={styles.topbarContainer}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <h1 className={styles.logo}>Estudos S.A - Fórum</h1>
          </div>

          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Buscar tópicos, exames, matérias"
              type="text"
            />
          </div>

          <div className={styles.topRight}>
            <button className={styles.iconBtn} aria-label="Notificações">
              <FiBell />
            </button>

            <div className={styles.user}>
              <span>S</span>
              <FiChevronDown className={styles.chev} />
            </div>

            <button className={styles.logoutBtn} aria-label="Sair">
              <FiLogOut />
            </button>
          </div>
        </header>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebarCard}>
          <h2 className={styles.sidebarTitle}>Categorias</h2>
          <ul className={styles.categoryList}>
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={
                  selectedCategory.id === cat.id
                    ? `${styles.categoryItem} ${styles.active}`
                    : styles.categoryItem
                }
              >
                <span
                  className={
                    selectedCategory.id === cat.id
                      ? `${styles.categoryIcon} ${styles.iconActive}`
                      : styles.categoryIcon
                  }
                >
                  {cat.icon}
                </span>
                <span className={styles.categoryName}>{cat.name}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <div className={styles.titleBlock}>
              <h2 className={styles.mainTitle}>{selectedCategory.name}</h2>
              <p className={styles.mainSubtitle}>
                {selectedCategory.description}
              </p>
            </div>

            <button className={styles.createBtn}>
              <span className={styles.plusBox}>
                <FiPlus />
              </span>
              Criar Tópico
            </button>
          </div>

          <div className={styles.empty}>
            Nenhum tópico nesta categoria ainda. Seja o primeiro a criar um!
          </div>
        </main>
      </div>
    </div>
  );
}
