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
  FiMoreVertical,
} from "react-icons/fi";
import styles from "./Forum.module.css";

import * as BadWords from "bad-words";

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editTopicContent, setEditTopicContent] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifTimer = useRef(null);

  const userMenuRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [openPostMenuId, setOpenPostMenuId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({}); // { postId: [comments] }
  const [commentInputs, setCommentInputs] = useState({});
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // Lista inicial de palavrões/termos indevidos em PT-BR e variações comuns.
  const ptBrWords = [
    "puta",
    "porra",
    "caralho",
    "merda",
    "bosta",
    "fod",
    "foda",
    "foda-se",
    "cacete",
    "pau",
    "cu",
    "cuzao",
    "vai se foder",
    "filho da puta",
    "escroto",
    "idiota",
    "burro",
    "otario",
    "otário",
    "vagabundo",
    "vagabunda"
  ];
  // Palavras em inglês extras (o pacote já cobre a maioria, mas reforçamos algumas)
  const extraWords = ["fuck", "shit", "bitch", "asshole"];
  // Criador robusto de instância do bad-words (lida com CJS/ESM interop)
  const createFilterInstance = () => {
    let Ctor = null;
    try {
      if (typeof BadWords === "function") Ctor = BadWords;
      else if (BadWords && typeof BadWords.default === "function") Ctor = BadWords.default;
      else if (BadWords && typeof BadWords.Filter === "function") Ctor = BadWords.Filter;
      else if (BadWords && typeof BadWords.BadWordsFilter === "function") Ctor = BadWords.BadWordsFilter;
    } catch (e) {
      Ctor = null;
    }

    if (Ctor) {
      try {
        return new Ctor();
      } catch (e) {
        // continue to fallback
      }
    }

    // Fallback simples: busca substrings das palavras proibidas
    class SimpleFilter {
      constructor() {
        this._words = new Set();
      }
      isProfane(text) {
        if (!text) return false;
        const s = text.toLowerCase();
        for (const w of this._words) if (s.includes(w)) return true;
        return false;
      }
      clean(text) {
        if (!this.isProfane(text)) return text;
        let out = text;
        for (const w of this._words) {
          const esc = w.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
          const re = new RegExp(esc, "gi");
          out = out.replace(re, (m) => "*".repeat(m.length));
        }
        return out;
      }
      addWords(...words) {
        words.forEach((w) => this._words.add(w.toLowerCase()));
      }
    }

    return new SimpleFilter();
  };

  const profaneFilter = createFilterInstance();
  profaneFilter.addWords(...ptBrWords, ...extraWords);

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

  // Busca comentários associados aos posts carregados
  useEffect(() => {
    const loadCommentsForPosts = async () => {
      if (!posts || posts.length === 0) {
        setCommentsMap({});
        return;
      }

      const postIds = posts.map((p) => p.id);
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("id, post_id, name, user_id, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Erro ao buscar comentários:", error);
          setCommentsMap({});
          return;
        }

        const map = {};
        (data || []).forEach((c) => {
          if (!map[c.post_id]) map[c.post_id] = [];
          map[c.post_id].push(c);
        });
        setCommentsMap(map);
      } catch (e) {
        console.error("Falha ao carregar comentários:", e);
        setCommentsMap({});
      }
    };

    loadCommentsForPosts();
  }, [posts]);

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

    const { error: insertError } = await supabase
      .from("posts")
      .insert([newPost]);

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
    if (
      !confirm(
        "Tem certeza que deseja excluir este post? Esta ação é irreversível."
      )
    )
      return;

    setIsUploading(true);
    try {
      const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

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

  const handleSubmitComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) {
      alert("Escreva algo antes de enviar o comentário.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Você precisa estar logado para comentar.");
      return;
    }

    // Verifica palavrões/termos indevidos
    const cleaned = profaneFilter.clean(text);
    if (profaneFilter.isProfane(text) || cleaned !== text) {
      alert("Seu comentário contém palavras proibidas. Remova-as e tente novamente.");
      return;
    }

    setIsCommentSubmitting(true);
    try {
      const newComment = {
        post_id: postId,
        user_id: user.id,
        name: text,
      };

      const { error } = await supabase.from("comments").insert([newComment]);
      if (error) {
        console.error("Erro ao inserir comentário:", error);
        alert("Não foi possível enviar o comentário. Tente novamente.");
      } else {
        // Recarrega apenas os comentários deste post
        const { data: fresh, error: fetchErr } = await supabase
          .from("comments")
          .select("id, post_id, name, user_id, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (fetchErr) {
          console.error("Erro ao atualizar comentários:", fetchErr);
        } else {
          setCommentsMap((prev) => ({ ...prev, [postId]: fresh ?? [] }));
        }

        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;
    setIsCommentSubmitting(true);
    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) {
        console.error("Erro ao excluir comentário:", error);
        alert("Não foi possível excluir o comentário.");
      } else {
        // Atualiza localmente
        setCommentsMap((prev) => {
          const copy = { ...prev };
          copy[postId] = (copy[postId] || []).filter((c) => c.id !== commentId);
          return copy;
        });
      }
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setEditTopicTitle(post.title);
    setEditTopicContent(post.content);
    setCurrentImageUrl(post.image_url); // Define a imagem atual
    setImageFile(null); // Limpa o arquivo de imagem novo para edição
    setOpenPostMenuId(null); // Fecha o dropdown
    setIsEditModalOpen(true); // Abre o modal
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
    setEditTopicTitle("");
    setEditTopicContent("");
    setCurrentImageUrl(null);
    setImageFile(null);
  };

  const handleEditPost = async () => {
    if (!editTopicTitle.trim() || !editTopicContent.trim()) {
      alert("Por favor, preencha o título e o conteúdo.");
      return;
    }

    if (!editingPost) return;

    setIsUploading(true);
    let finalImageUrl = currentImageUrl;

    // --- 1. Lógica de Upload/Atualização de Imagem ---
    if (imageFile) {
      // Se um novo arquivo foi selecionado, faz o upload
      const fileName = `${user.id}-${Date.now()}-edit`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("image-posts")
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error("Erro no upload da nova imagem:", uploadError);
        alert("Falha ao enviar a nova imagem. Tente novamente.");
        setIsUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("image-posts")
        .getPublicUrl(uploadData.path);

      finalImageUrl = publicUrlData.publicUrl;

      // TENTA REMOVER A IMAGEM ANTIGA SE ELA EXISTIR
      if (currentImageUrl && currentImageUrl.includes("/image-posts/")) {
        try {
          const parts = currentImageUrl.split("/image-posts/");
          let path = parts[1] ?? "";
          path = path.split("?")[0];
          const decodedPath = decodeURIComponent(path);
          if (decodedPath) {
            await supabase.storage.from("image-posts").remove([decodedPath]);
          }
        } catch (e) {
          console.warn("Falha ao remover imagem antiga do storage:", e);
        }
      }
    }

    // --- 2. Atualizar o Post no Banco de Dados ---
    const updatedPost = {
      title: editTopicTitle,
      content: editTopicContent,
      image_url: finalImageUrl,
    };

    const { error: updateError } = await supabase
      .from("posts")
      .update(updatedPost)
      .eq("id", editingPost.id);

    setIsUploading(false);

    if (updateError) {
      console.error("Erro ao atualizar o post:", updateError.message);
      alert("Não foi possível salvar as alterações. Tente novamente.");
    } else {
      alert("Post atualizado com sucesso!");
      handleCloseEditModal();
      // Recarrega os posts para mostrar a atualização
      fetchPosts(selectedCategory.id);
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
                    <button
  className={styles.menuItem}
  onClick={() => {
    navigate("/usuario");
    setShowUserMenu(false);
  }}
>
  Meu Perfil
</button>

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

                    {user && user.id === p.user_id && (
                      <div className={styles.postActionsWrapper}>
                        {" "}
                        {/* Adicionar um wrapper para posicionamento */}
                        <button
                          className={styles.postMenuBtn} // Estilizar este botão
                          onClick={() =>
                            setOpenPostMenuId(
                              p.id === openPostMenuId ? null : p.id
                            )
                          }
                          aria-label="Opções do post"
                        >
                          <FiMoreVertical size={20} />
                        </button>
                        {openPostMenuId === p.id && (
                          <div className={styles.postMenuDropdown} role="menu">
                            {" "}
                            {/* Estilizar este dropdown */}
                            {/* Opção de Editar (Placeholder) */}
                            <button
                              role="menuitem"
                              className={styles.menuItem}
                              onClick={() => handleOpenEditModal(p)} // <-- CHAMAR A NOVA FUNÇÃO AQUI
                            >
                              Editar
                            </button>
                            {/* Opção de Excluir */}
                            <button
                              role="menuitem"
                              className={`${styles.menuItem} ${styles.deleteItem}`} // Adicionar classe para cor vermelha
                              onClick={() => {
                                handleDeletePost(p.id, p.image_url);
                                setOpenPostMenuId(null); // Fechar após a ação
                              }}
                              disabled={isUploading}
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Comentários */}
                  <div className={styles.commentsSection}>
                    <h4 className={styles.commentsTitle}>Comentários</h4>
                    <div className={styles.commentsList}>
                      {(commentsMap[p.id] || []).map((c) => (
                        <div key={c.id} className={styles.commentItem}>
                          <div className={styles.commentContent}>{c.name}</div>
                          <div className={styles.commentMeta}>
                            <small>{new Date(c.created_at).toLocaleString()}</small>
                            {user && user.id === c.user_id && (
                              <button
                                className={styles.commentDelete}
                                onClick={() => handleDeleteComment(c.id, p.id)}
                                disabled={isCommentSubmitting}
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Campo de novo comentário */}
                    <div className={styles.commentForm}>
                      <textarea
                        placeholder="Escreva um comentário..."
                        value={commentInputs[p.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className={styles.commentInput}
                      />
                      <div className={styles.commentActions}>
                        <button
                          className={styles.publishBtn}
                          onClick={() => handleSubmitComment(p.id)}
                          disabled={isCommentSubmitting}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
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

      {isEditModalOpen && editingPost && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Editar Tópico</h2>

            <label className={styles.label}>Título</label>
            <input
              type="text"
              placeholder="Digite um título descritivo..."
              className={styles.input}
              value={editTopicTitle}
              onChange={(e) => setEditTopicTitle(e.target.value)}
            />

            <label className={styles.label}>Conteúdo</label>
            <textarea
              placeholder="Descreva sua dúvida, compartilhe material ou inicie uma discussão..."
              className={styles.textarea}
              value={editTopicContent}
              onChange={(e) => setEditTopicContent(e.target.value)}
            ></textarea>

            {/* Categoria é mantida, mas não pode ser editada neste modal para simplicidade */}
            <label className={styles.label}>Categoria (Não editável)</label>
            <input
              type="text"
              className={styles.input}
              value={selectedCategory.name}
              readOnly
              disabled
            />

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
                  Novo arquivo: <strong>{imageFile.name}</strong> (Será enviado)
                </p>
              ) : currentImageUrl ? (
                <p>
                  Imagem atual: <strong>{currentImageUrl.split('/').pop().split('?')[0]}</strong>. Clique para trocar.
                </p>
              ) : (
                <p>Clique para anexar uma imagem</p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={handleCloseEditModal}
              >
                Cancelar
              </button>
              <button
                className={styles.publishBtn}
                onClick={handleEditPost} // <-- CHAMA A FUNÇÃO DE EDIÇÃO
                disabled={isUploading}
              >
                {isUploading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
