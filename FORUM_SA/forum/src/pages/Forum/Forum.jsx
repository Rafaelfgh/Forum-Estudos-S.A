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
  // Estado para feedback visual durante o upload
  const [isUploading, setIsUploading] = useState(false);
  // Ref para acessar o input de arquivo escondido
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);

  // ADICIONE A LINHA ABAIXO
  const [showUserMenu, setShowUserMenu] = useState(false);

  // --- MANTENHA A LÓGICA ORIGINAL DA PÁGINA PRINCIPAL ---
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // --- LÓGICA PARA O MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. NOVO ESTADO APENAS PARA AS CATEGORIAS DO MODAL
  const [modalCategories, setModalCategories] = useState([]); // Este buscará do Supabase

  // Estado para guardar o ID da categoria selecionada no modal
  const [topicCategory, setTopicCategory] = useState("");

  // Estados para o título e conteúdo do tópico
  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");

  // notificações
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifTimer = useRef(null);

  const userMenuRef = useRef(null);

  useEffect(() => {
    async function fetchModalCategories() {
      // Use o nome da sua tabela de categorias no Supabase
      // Selecionamos apenas 'id' e 'name', que é tudo que o <select> precisa
      const { data, error } = await supabase
        .from("category") // << MUDE AQUI para o nome da sua tabela
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar categorias para o modal:", error);
      } else if (data) {
        setModalCategories(data);
        // Define um valor padrão para o select, se houver dados
        if (data.length > 0) {
          setTopicCategory(data[0].id);
        }
      }
    }

    fetchModalCategories();
  }, []); // [] garante que rode só uma vez

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

    setIsUploading(true); // Inicia o estado de "carregando"
    let imageUrl = null; // Inicia a URL da imagem como nula

    // ETAPA DE UPLOAD DA IMAGEM
    if (imageFile) {
      // Cria um nome de arquivo único para evitar conflitos
      const fileName = `${user.id}-${Date.now()}`;

      // Substitua 'image-posts' pelo nome exato do seu bucket no Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("image-posts")
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error("Erro no upload da imagem:", uploadError);
        alert("Falha ao enviar a imagem. Tente novamente.");
        setIsUploading(false); // Para o "carregando"
        return; // Interrompe a execução
      }

      // Se o upload deu certo, pega a URL pública
      const { data: publicUrlData } = supabase.storage
        .from("image-posts")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    // ETAPA DE INSERÇÃO NO BANCO DE DADOS
    const newPost = {
      title: topicTitle,
      content: topicContent,
      category_id: topicCategory,
      user_id: user.id,
      image_url: imageUrl, // Adiciona a URL da imagem (ou null se não houver imagem)
    };

    const { error: insertError } = await supabase
      .from("posts")
      .insert([newPost]);

    setIsUploading(false); // Finaliza o estado de "carregando"

    if (insertError) {
      console.error("Erro ao criar o post:", insertError.message);
      alert("Não foi possível criar o post. Tente novamente.");
    } else {
      alert("Post criado com sucesso!");
      // Limpa tudo e fecha o modal
      setTopicTitle("");
      setTopicContent("");
      setImageFile(null); // Limpa o arquivo de imagem
      setIsModalOpen(false);
    }
  };

  // nome do usuário
  const userName = user?.user_metadata?.full_name ?? user?.email ?? "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "";

  // logout rápido
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

      {/*/////////////////// MODAL CRIAR TÓPICO //////////////////////*/}
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
              value={topicTitle} // Conecta o valor ao estado
              onChange={(e) => setTopicTitle(e.target.value)} // Atualiza o estado a cada digitação
            />

            {/* conteúdo */}
            <label className={styles.label}>Conteúdo</label>
            <textarea
              placeholder="Descreva sua dúvida, compartilhe material ou inicie uma discussão..."
              className={styles.textarea}
              value={topicContent} // Conecta o valor ao estado
              onChange={(e) => setTopicContent(e.target.value)} // Atualiza o estado a cada digitação
            ></textarea>

            {/* categoria */}
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


            {/* arquivos */}
            <label className={styles.label}>Anexar Imagem</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              accept="image/png, image/jpeg, image/gif" // Aceita apenas imagens
            />
            <div
              className={styles.fileUpload}
              onClick={() => fileInputRef.current.click()} // Ao clicar aqui, aciona o input
            >
              <FiUpload size={20} />
              {/* Mostra o nome do arquivo selecionado ou o texto padrão */}
              {imageFile ? (
                <p>
                  Arquivo selecionado: <strong>{imageFile.name}</strong>
                </p>
              ) : (
                <p>Clique para anexar uma imagem</p>
              )}
            </div>

            {/* ações */}
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
                disabled={isUploading} // Desabilita o botão durante o upload
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
