import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FiUpload,
} from "react-icons/fi";
import styles from "./Forum.module.css";

import { supabase } from "../../backend/supabaseClient"; 

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
  const navigate = useNavigate();

  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifTimer = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // controla usuário e menu
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // checa sessão ao montar e escuta mudanças de auth
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (supabase.auth.getUser) {
          const { data } = await supabase.auth.getUser();
          if (mounted) setUser(data?.user ?? null);
        } else if (supabase.auth.user) {
          if (mounted) setUser(supabase.auth.user());
        }
      } catch {
        if (mounted) setUser(null);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // fecha menu ao clicar fora
  useEffect(() => {
    function handleDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  const handleLogout = async () => {
    if (!user) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error.message);
    } else {
      navigate("/");
    }
  };

  // desloga e vai para tela de login para permitir trocar de conta
  const handleSwitchLogin = async () => {
    setShowUserMenu(false);
    await supabase.auth.signOut();
    navigate("/login"); // ajuste se sua rota de login for diferente
  };

  const handleNotifClick = () => {
    setShowNotif(true);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => {
      setShowNotif(false);
      notifTimer.current = null;
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (notifTimer.current) {
        clearTimeout(notifTimer.current);
        notifTimer.current = null;
      }
    };
  }, []);

  // inicial do usuário (ou letra genérica quando não logado)
  const userInitial = (() => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name ?? user.email ?? "";
    return (name.trim().charAt(0) || "U").toUpperCase();
  })();

  return (
    <div className={styles.forum}>
      <div className={styles.topbarContainer}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <h1 className={styles.logo}>Estudos S.A</h1>
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
            <button
              className={styles.iconBtn}
              aria-label="Notificações"
              onClick={handleNotifClick}
            >
              <FiBell />
            </button>

            {showNotif && (
              <div
                className={styles.notifMessage}
                role="status"
                aria-live="polite"
              >
                {notificationsCount > 0
                  ? `Você tem ${notificationsCount} nova(s) notificação(ões)`
                  : "Nenhuma nova notificação"}
              </div>
            )}

            {/* botão do usuário funcional */}
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
                  {user && (
                    <div className={styles.userInfo}>
                      <strong className={styles.userName}>
                        {user.user_metadata?.full_name ?? user.email}
                      </strong>
                    </div>
                  )}

                  {user ? (
                    <>
                      <button
                        className={styles.userMenuItem}
                        onClick={handleSwitchLogin}
                        role="menuitem"
                      >
                        Trocar de login
                      </button>

                      <button
                        className={styles.userMenuItem}
                        onClick={async () => {
                          setShowUserMenu(false);
                          await handleLogout();
                        }}
                        role="menuitem"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.userMenuItem}
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/login");
                      }}
                      role="menuitem"
                    >
                      Entrar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* botão Sair rápido (aparece apenas se usuário logado) */}
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

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Novo Tópico de {selectedCategory.name}</h2>

            <label className={styles.label}>Título</label>
            <input
              type="text"
              placeholder="Digite um título descritivo..."
              className={styles.input}
            />

            <label className={styles.label}>Conteúdo</label>
            <textarea
              placeholder="Descreva sua dúvida, compartilhe material ou inicie uma discussão..."
              className={styles.textarea}
            ></textarea>

            <label className={styles.label}>Tags (opcional)</label>
            <div className={styles.tagsRow}>
              <input
                type="text"
                placeholder="Ex: matemática, enem, direito..."
                className={styles.input}
              />
              <button className={styles.addTagBtn}>Adicionar</button>
            </div>

            <label className={styles.label}>Anexar Arquivos (opcional)</label>
            <div className={styles.fileUpload}>
              <FiUpload size={20} />
              <p>Clique para anexar PDFs, imagens ou documentos</p>
            </div>

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