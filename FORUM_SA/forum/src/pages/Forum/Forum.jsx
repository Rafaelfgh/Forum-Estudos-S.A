import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBookOpen, FaQuestionCircle, FaBullhorn, FaUsers, FaComments } from "react-icons/fa";
import { FiSearch, FiBell, FiChevronDown, FiPlus, FiUpload, FiLogOut } from "react-icons/fi";
import styles from "./Forum.module.css";

import { supabase } from "../../backend/supabaseClient"; 

// Lista de categorias fixas
const categories = [
  { id: 1, name: "Materiais de Estudo", description: "Compartilhe PDFs, resumos, mapas mentais e provas", icon: <FaBookOpen /> },
  { id: 2, name: "Perguntas & Respostas", description: "Tire dúvidas e ajude outros colegas", icon: <FaQuestionCircle /> },
  { id: 3, name: "Notícias de Concursos", description: "Fique por dentro das últimas novidades", icon: <FaBullhorn /> },
  { id: 4, name: "Networking & Grupos", description: "Encontre parceiros de estudo", icon: <FaUsers /> },
  { id: 5, name: "Motivação & Bate-papo", description: "Compartilhe experiências e motivação", icon: <FaComments /> },
];

export default function Forum() {
  const navigate = useNavigate();

  // usuário
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // categorias e modal
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicCategory, setTopicCategory] = useState(categories[0].id);

  // notificações
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifTimer = useRef(null);

  // pega usuário logado
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) setUser(data?.user ?? null);
      } catch {
        if (mounted) setUser(null);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // mostra notificações
  const handleNotifClick = () => {
    setShowNotif(true);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => {
      setShowNotif(false);
      notifTimer.current = null;
    }, 5000);
  };

  // nome do usuário
  const userName = user?.user_metadata?.full_name ?? user?.email ?? "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "";

  // logout rápido
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className={styles.forum}>
      {/* TOPO */}
      <div className={styles.topbarContainer}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <h1 className={styles.logo}>Estudos S.A</h1>
          </div>

          {/* busca */}
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Buscar tópicos, exames, matérias"
              type="text"
            />
          </div>

          {/* lado direito */}
          <div className={styles.topRight}>
            {/* notificações */}
            <button
              className={styles.iconBtn}
              aria-label="Notificações"
              onClick={handleNotifClick}
            >
              <FiBell />
            </button>

            {showNotif && (
              <div className={styles.notifMessage} role="status" aria-live="polite">
                {notificationsCount > 0
                  ? `Você tem ${notificationsCount} nova(s) notificação(ões)`
                  : "Nenhuma nova notificação"}
              </div>
            )}

            {/* menu usuário */}
            <div className={styles.userWrapper} ref={userMenuRef}>
              <button
                className={styles.user}
                aria-label="Menu do usuário"
                onClick={() => setShowUserMenu((v) => !v)}
              >
                <span>{userInitial}</span>
                <FiChevronDown className={styles.chev} />
              </button>

              {showUserMenu && (
                <div className={styles.userMenu} role="menu">
                  <div className={styles.userInfo}>
                    <strong className={styles.userName}>{userName}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* botão logout rápido */}
            {user && (
              <button
                className={styles.logoutBtn}
                aria-label="Sair"
                onClick={handleLogout}
              >
                <FiLogOut />
              </button>
            )}
          </div>
        </header>
      </div>

      {/* CONTEÚDO */}
      <div className={styles.content}>
        {/* categorias */}
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

        {/* área principal */}
        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <div className={styles.titleBlock}>
              <h2 className={styles.mainTitle}>{selectedCategory.name}</h2>
              <p className={styles.mainSubtitle}>{selectedCategory.description}</p>
            </div>

            <button
              className={styles.createBtn}
              onClick={() => setIsModalOpen(true)}
            >
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

      {/* MODAL CRIAR TÓPICO */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Novo Tópico</h2>

            {/* título */}
            <label className={styles.label}>Título</label>
            <input
              type="text"
              placeholder="Digite um título descritivo..."
              className={styles.input}
            />

            {/* conteúdo */}
            <label className={styles.label}>Conteúdo</label>
            <textarea
              placeholder="Descreva sua dúvida, compartilhe material ou inicie uma discussão..."
              className={styles.textarea}
            ></textarea>

            {/* categoria */}
            <label className={styles.label}>Categoria</label>
            <select
              className={styles.input}
              value={topicCategory}
              onChange={(e) => setTopicCategory(Number(e.target.value))}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* tags */}
            <label className={styles.label}>Tags (opcional)</label>
            <div className={styles.tagsRow}>
              <input
                type="text"
                placeholder="Ex: matemática, enem, direito..."
                className={styles.input}
              />
              <button className={styles.addTagBtn}>Adicionar</button>
            </div>

            {/* arquivos */}
            <label className={styles.label}>Anexar Arquivos (opcional)</label>
            <div className={styles.fileUpload}>
              <FiUpload size={20} />
              <p>Clique para anexar PDFs, imagens ou documentos</p>
            </div>

            {/* ações */}
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button className={styles.publishBtn}>Publicar Tópico</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
