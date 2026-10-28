// ==========================================
// 1. INTERFACES (El contrato de datos)
// ==========================================

interface Peliculas {
  id: number;
  title: string;
  poster_path: string | undefined;
  overview: string;
  vote_average: number;
  release_date: string;
}

interface Paginacion {
  page: number;
  results: Peliculas[];
  total_pages: number;
  total_results: number;
}

// ==========================================
// 2. SELECCIÓN DEL DOM
// ==========================================
const d = document;
//dom para el input
const form = d.querySelector("#search-form") as HTMLFormElement;
const input = document.querySelector("#search-input") as HTMLInputElement;
let searchTimeOut: number | undefined;
let requestId = 0;
//dom para el mensaje de error o carga
const message = d.querySelector("#message") as HTMLParagraphElement;
//dom para el template / molde oculto
const template = d.querySelector("#movie-card-template") as HTMLTemplateElement;
//dom del grid
const movieGrid = d.querySelector("#movie-grid") as HTMLElement;
//dom de la paginacion
const pageInfo = d.querySelector("#page-info") as HTMLSpanElement;
const btnPrev = d.querySelector("#prev-page") as HTMLButtonElement;
const btnNext = d.querySelector("#next-page") as HTMLButtonElement;
let currentPage = 1;
let currentSearch = "";
//dom modal
const modal = d.querySelector("#modal") as HTMLDialogElement;
const closeModalBtn = document.querySelector(
  "#close-modal",
) as HTMLButtonElement;
const modalPoster = document.querySelector("#modal-poster") as HTMLImageElement;
const modalTitle = document.querySelector("#modal-title") as HTMLElement;
const modalDate = document.querySelector("#modal-date") as HTMLElement;
const modalScore = document.querySelector("#modal-score") as HTMLElement;
const modalOverview = document.querySelector("#modal-overview") as HTMLElement;
const modalGenres = document.querySelector("#modal-genres") as HTMLUListElement;

// Funcion Busquedad
async function searchMovie(texto: string, page: number = 1) {
  const currentRequest = ++requestId; //Contador de peticiones

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${texto}&language=es-ES&page=${page}`;

  try {
    message.textContent = "Buscando...";
    message.classList.remove("is-error");

    const response = await fetch(url);
    if (!response.ok) {
      movieGrid.innerHTML = "";
      message.textContent = `No se encontraron resultados para ${texto}. Inténtalo de nuevo`;
      message.classList.add("is-error");
      btnPrev.disabled = true;
      btnNext.disabled = true;
      return;
    }

    const data = (await response.json()) as Paginacion;
    currentPage = data.page;

    if (currentRequest !== requestId) return;
    renderizarPeliculas(data.results);

    //logica btns
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= data.total_pages;

    pageInfo.textContent = `Página ${data.page} de ${data.total_pages}`;
    message.textContent = "";
  } catch (error) {
    if (currentRequest !== requestId) return;
    console.log(error);
    message.textContent = "Error al conectar con la API.";
    message.classList.add("is-error");
  }
}

//Busquedad con Debounce
//Input
input.addEventListener("input", (e) => {
  const text = (e.target as HTMLInputElement).value.toLowerCase().trim();
  //Cancelamos el temporizador anterior (Debounce)
  window.clearTimeout(searchTimeOut);

  if (text.length >= 3) {
    currentSearch = text;
    searchTimeOut = window.setTimeout(() => searchMovie(text), 350);
  } else if (text.length === 0) {
    currentSearch = "";
    popularMovies(1);
  } else {
    movieGrid.innerHTML = "";
    message.textContent = "Escribe al menos 3 caracteres...";
    message.classList.remove("is-error");
  }
});

//Form
form.addEventListener("submit", (e) => {
  e.preventDefault();
  window.clearTimeout(searchTimeOut);

  const text = input.value.toLowerCase().trim();
  if (text.length >= 3) {
    currentSearch = text;
    searchMovie(text);
  }
});
//Fin de la funcion busquedad

function renderizarPeliculas(peliculas: Peliculas[]) {
  movieGrid.innerHTML = ""; // Limpiamos la pantalla

  peliculas.forEach((peli) => {
    const clone = template.content.cloneNode(true) as DocumentFragment;

    const img = clone.querySelector(".poster") as HTMLImageElement;
    const score = clone.querySelector(".score") as HTMLSpanElement;
    const scoreValue = clone.querySelector(".score-value") as HTMLSpanElement;
    const detailBtn = clone.querySelector(".details-btn") as HTMLButtonElement;
    const title = clone.querySelector(".movie-title") as HTMLElement;
    const meta = clone.querySelector(".movie-meta") as HTMLParagraphElement;

    // IMG (con manejo por si no hay póster)
    const urlImagen = "https://image.tmdb.org/t/p/w500";
    if (peli.poster_path) {
      img.src = `${urlImagen}${peli.poster_path}`;
    } else {
      img.src = "https://via.placeholder.com/500x750?text=Sin+Imagen";
    }
    img.alt = peli.title;

    // SCORE
    const percent = peli.vote_average * 10;
    score.style.setProperty("--percent", percent.toString());
    scoreValue.textContent = peli.vote_average.toFixed(1);

    // BTN, TITLE, META
    detailBtn.dataset.id = peli.id.toString();
    title.textContent = peli.title;
    const year = peli.release_date ? peli.release_date.split("-")[0] : "N/A";
    meta.textContent = year;

    movieGrid.appendChild(clone);
  });
}

//Funcion para clonar la tarjeta
async function popularMovies(page: number = 1) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=es-ES&page=${page}`;

  try {
    message.textContent = "Cargando cartelera...";
    message.classList.remove("is-error");

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar la API");

    const data = (await response.json()) as Paginacion;
    //Actualizamos la pagina actual global
    currentPage = data.page;
    renderizarPeliculas(data.results);

    //Actualizamos el texto de la paginacion
    pageInfo.textContent = `Página ${data.page} de ${data.total_pages}`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= data.total_pages;

    message.textContent = "";
  } catch (error) {
    console.error(error);
    message.textContent = "Hubo un error al cargar las peliculas";
    message.classList.add("is-error");
  }
}
//Ejecutamos la funcion
popularMovies();
//fin de la funcion

/* Paginacion */
btnPrev.addEventListener("click", () => {
  if (currentPage > 1) {
    if (currentSearch !== "") {
      searchMovie(currentSearch, currentPage - 1);
    } else {
      popularMovies(currentPage - 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

btnNext.addEventListener("click", () => {
  if (currentSearch !== "") {
    searchMovie(currentSearch, currentPage + 1);
  } else {
    popularMovies(currentPage + 1);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* Modal */
movieGrid.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;

  if (target.classList.contains("details-btn")) {
    const id = target.dataset.id;
    if (!id) return;

    //url
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=es-ES`;

    try {
      message.textContent = "Cargando detalles...";
      message.classList.remove("is-error");

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar los detalles");

      const data = await response.json();

      //Llenamos los campos del modal
      const modalPosterImg = "https://image.tmdb.org/t/p/w500";
      modalPoster.src = data.poster_path
        ? `${modalPosterImg}${data.poster_path}`
        : "https://via.placeholder.com/500x750?text=Sin+Imagen";
      modalTitle.textContent = data.title;
      modalDate.textContent = data.release_date || "N/A";
      modalScore.textContent = data.vote_average.toFixed(1);
      modalOverview.textContent = data.overview || "Sin sinopsis disponible";

      //Limpiamos
      modalGenres.innerHTML = "";

      data.genres.forEach((genero: { id: number; name: string }) => {
        const li = d.createElement("li");
        li.textContent = genero.name;
        modalGenres.appendChild(li);
      });
      message.textContent = "";
      modal.showModal(); //Abrimos el modal
    } catch (error) {
      message.textContent = "No se pudieron cargar los detalles.";
      message.classList.add("is-error");
      console.error("Error al cargar los detalles:", error);
    }
  }
});

// Evento para cerrar modal
closeModalBtn.addEventListener("click", () => {
  modal.close();
});

// Cerrar modal haciendo clic fuera de la caja
modal.addEventListener("click", (e) => {
  const rect = modal.getBoundingClientRect();
  const isInDialog =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;
  if (!isInDialog) {
    modal.close();
  }
});
