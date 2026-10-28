interface Pelicula {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
}

//Devuelve las peliculas en un objeto
interface TMDBResponse {
  results: Pelicula[];
}

//DOM
const message = document.querySelector("#message") as HTMLParagraphElement;
const movieGrid = document.querySelector("#movie-grid") as HTMLElement;
const template = document.querySelector(
  "#movie-card-template",
) as HTMLTemplateElement;
const modal = document.querySelector("#modal") as HTMLDialogElement;
const closeModalBtn = document.querySelector(
  "#close-modal",
) as HTMLButtonElement;
const modalPoster = document.querySelector("#modal-poster") as HTMLImageElement;
const modalTitle = document.querySelector("#modal-title") as HTMLElement;
const modalDate = document.querySelector("#modal-date") as HTMLElement;
const modalScore = document.querySelector("#modal-score") as HTMLElement;
const modalOverview = document.querySelector("#modal-overview") as HTMLElement;
const modalGenres = document.querySelector("#modal-genres") as HTMLUListElement;

// ===============================
//3. Funciones creadoras html dinamico
// ===============================

//funcion GET
async function popularMovies() {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=es-ES`;

  try {
    message.textContent = "Cargando cartelera...";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar la API");

    const data = (await response.json()) as TMDBResponse;
    const peliculas = data.results;

    movieGrid.innerHTML = "";

    peliculas.forEach((pelicula) => {
      const clone = template.content.cloneNode(true) as DocumentFragment;

      //Elementos dentro del clon
      const img = clone.querySelector(".poster") as HTMLImageElement;
      const title = clone.querySelector(".movie-title") as HTMLElement;
      const meta = clone.querySelector(".movie-meta") as HTMLElement;
      const score = clone.querySelector(".score") as HTMLElement;
      const scoreValue = clone.querySelector(".score-value") as HTMLElement;
      const detailBtn = clone.querySelector(
        ".details-btn",
      ) as HTMLButtonElement;

      //Llenamos los datos
      const urlImagen = "https://image.tmdb.org/t/p/w500";
      img.src = `${urlImagen}${pelicula.poster_path}`;
      img.alt = pelicula.title;
      title.textContent = pelicula.title;

      //Anio de estreno
      const year = pelicula.release_date
        ? pelicula.release_date.split("-")[0]
        : "N/A";
      meta.textContent = year;

      //Puntuacion
      const percent = pelicula.vote_average * 10;
      score.style.setProperty("--percent", percent.toString());
      scoreValue.textContent = pelicula.vote_average.toFixed(1);

      //Guardamos el id en el btn para usarlo en el modal
      detailBtn.dataset.id = pelicula.id.toString();

      //Metemos la tarjeta en el grid
      movieGrid.appendChild(clone);
    });
    message.textContent = "";
  } catch (error) {
    console.error({ error: "Hubo un error al cargar las peliculas" });
    message.textContent = "Hubo un error al cargar las peliculas";
    message.classList.add("is-error");
  }
}
//Ejecutamos la función
popularMovies();

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
      if (!response.ok) throw new Error("Error al cargar detalles");

      const data = await response.json();

      //Llenamos todos los campos del modal
      const modalPosterImg = "https://image.tmdb.org/t/p/w500";
      modalPoster.src = `${modalPosterImg}${data.poster_path}`;
      modalTitle.textContent = data.title;
      modalDate.textContent = data.release_date || "N/A";
      modalScore.textContent = data.vote_average.toFixed(1);
      modalOverview.textContent = data.overview || "Sin sinopsis disponible";

      //Limpiamos generos anteriores y pintamos los nuevos
      modalGenres.innerHTML = "";

      data.genres.forEach((genero: any) => {
        const li = document.createElement("li");
        li.textContent = genero.name;
        modalGenres.appendChild(li);
      });

      message.textContent = "";
      modal.showModal(); //Abrimos el modal
    } catch (error) {
      console.error({ error: "Hubo un error al cargar los detalles" });
      message.textContent = "Hubo un error al cargar los detalles";
      message.classList.add("is-error");
    }
  }
});

// Evento para cerrar modal
closeModalBtn.addEventListener("click", () => {
  modal.close();
});

// Cerrar modal haciendo clic afuera
modal.addEventListener("click", (e) => {
  const react = modal.getBoundingClientRect();
  const isDiialog =
    e.clientX >= react.left &&
    e.clientX >= react.right &&
    e.clientY >= react.top &&
    e.clientY >= react.bottom;

  if (!isDiialog) {
    modal.close();
  }
});
