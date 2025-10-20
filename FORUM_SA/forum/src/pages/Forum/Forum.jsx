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
  FiUpload,
  FiLogOut,
  FiTrash,
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
  const navigate = useNavigate();

  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalCategories, setModalCategories] = useState([]);

  const [topicCategory, setTopicCategory] = useState("");

  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");

  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifTimer = useRef(null);

  const userMenuRef = useRef(null);

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchModalCategories() {
      const { data, error } = await supabase
        .from("category")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar categorias para o modal:", error);
      } else if (data) {
        setModalCategories(data);
        if (data.length > 0) {
          setTopicCategory(data[0].id);
        }
      }
    }

    fetchModalCategories();
  }, []);

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

  const fetchPosts = async (categoryId) => {
    if (!categoryId) {
      setPosts([]);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("id, title, content, category_id, user_id, image_url, created_at")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar posts:", error);
      setPosts([]);
    } else {
      setPosts(data ?? []);
    }
  };

  useEffect(() => {
    if (selectedCategory?.id) {
      fetchPosts(selectedCategory.id);
    }
  }, [selectedCategory]);

  const handleNotifClick = () => {
    setShowNotif(true);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => {
      setShowNotif(false);
      notifTimer.current = null;
    }, 5000);
  };

  const handlePublishTopic = async () => {
    if (!topicTitle.trim() || !topicContent.trim()) {
      alert("Por favor, preencha o título e o conteúdo.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Você precisa estar logado para criar um post.");
      return;
    }

    setIsUploading(true);
    let imageUrl = null;

    if (imageFile) {
      const fileName = `${user.id}-${Date.now()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("image-posts")
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error("Erro no upload da imagem:", uploadError);
        alert("Falha ao enviar a imagem. Tente novamente.");
        setIsUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("image-posts")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    const newPost = {
      title: topicTitle,
      content: topicContent,
      category_id: topicCategory,
      user_id: user.id,
      image_url: imageUrl,
    };

    const { error: insertError } = await supabase.from("posts").insert([newPost]);

    setIsUploading(false);

    if (insertError) {
      console.error("Erro ao criar o post:", insertError.message);
      alert("Não foi possível criar o post. Tente novamente.");
    } else {
      alert("Post criado com sucesso!");
      setTopicTitle("");
      setTopicContent("");
      setImageFile(null);
      setIsModalOpen(false);

      if (selectedCategory?.id !== topicCategory) {
        const found = modalCategories.find((c) => c.id === topicCategory);
        setSelectedCategory({
          id: topicCategory,
          name: found?.name ?? "Categoria",
          description: "",
        });
      } else {
        fetchPosts(topicCategory);
      }
    }
  };

  // Função para excluir post (visível só para autor)
  const handleDeletePost = async (postId, imageUrl) => {
    if (!confirm("Tem certeza que deseja excluir este post? Esta ação é irreversível.")) return;

    setIsUploading(true);
    try {
      const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);

      if (deleteError) {
        console.error("Erro ao excluir post:", deleteError);
        alert("Não foi possível excluir o post. Tente novamente.");
        return;
      }

      // Tenta remover imagem do storage se a URL indicar o bucket "image-posts"
      if (imageUrl && imageUrl.includes("/image-posts/")) {
        try {
          // extrai o path depois de /image-posts/
          const parts = imageUrl.split("/image-posts/");
          let path = parts[1] ?? "";
          // remove query string se houver
          path = path.split("?")[0];
          const decodedPath = decodeURIComponent(path);
          if (decodedPath) {
            const { error: removeError } = await supabase.storage
              .from("image-posts")
              .remove([decodedPath]);
            if (removeError) {
              console.warn("Erro ao remover imagem do storage:", removeError);
            }
          }
        } catch (e) {
          console.warn("Falha ao tentar remover imagem do storage:", e);
        }
      }

      // Atualiza lista de posts (recarrega da categoria atual)
      if (selectedCategory?.id) {
        fetchPosts(selectedCategory.id);
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }

      alert("Post excluído com sucesso.");
    } finally {
      setIsUploading(false);
    }
  };

  const userName = user?.user_metadata?.full_name ?? user?.email ?? "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

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

          {posts.length === 0 ? (
            <div className={styles.empty}>
              Nenhum tópico nesta categoria ainda. Seja o primeiro a criar um!
            </div>
          ) : (
            <div className={styles.postList}>
              {posts.map((p) => (
                <article key={p.id} className={styles.postCard}>
                  <h3 className={styles.postTitle}>{p.title}</h3>
                  <p className={styles.postContent}>
                    {p.content.length > 300
                      ? p.content.slice(0, 300) + "..."
                      : p.content}
                  </p>
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className={styles.postImage}
                    />
                  )}
                  <div className={styles.postMeta}>
                    <small>
                      Publicado em {new Date(p.created_at).toLocaleString()}
                    </small>

                    {/* Botão de excluir visível apenas para o autor */}
                    {user && user.id === p.user_id && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeletePost(p.id, p.image_url)}
                        aria-label="Excluir post"
                        disabled={isUploading}
                        style={{ marginLeft: 12 }}
                      >
                        <FiTrash />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Novo Tópico</h2>

            <label className={styles.label}>Título</label>
            <input
              type="text"
              placeholder="Digite um título descritivo..."
              className={styles.input}
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
            />

            <label className={styles.label}>Conteúdo</label>
            <textarea
              placeholder="Descreva sua dúvida, compartilhe material ou inicie uma discussão..."
              className={styles.textarea}
              value={topicContent}
              onChange={(e) => setTopicContent(e.target.value)}
            ></textarea>

            <label className={styles.label}>Categoria</label>
            <select
              className={styles.input}
              value={topicCategory}
              onChange={(e) => setTopicCategory(Number(e.target.value))}
            >
              {modalCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label className={styles.label}>Anexar Imagem</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              accept="image/png, image/jpeg, image/gif"
            />
            <div
              className={styles.fileUpload}
              onClick={() => fileInputRef.current.click()}
            >
              <FiUpload size={20} />
              {imageFile ? (
                <p>
                  Arquivo selecionado: <strong>{imageFile.name}</strong>
                </p>
              ) : (
                <p>Clique para anexar uma imagem</p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.publishBtn}
                onClick={handlePublishTopic}
                disabled={isUploading}
              >
                {isUploading ? "Publicando..." : "Publicar Tópico"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
