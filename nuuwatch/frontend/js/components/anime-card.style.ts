const defaultCardWidth = '128px';
/* language=css */
export const animeCardStyle = ` 
:root {

}

.title, p {
  margin: 0;
}

.card {
  width: var(--card-size, ${defaultCardWidth});
}

.poster {
  --img-size: calc(var(--card-size, ${defaultCardWidth}) - 2rem);
  width: var(--img-size);
  height: calc(var(--img-size) * 1.15);
  object-fit: cover;
}

.body {
  display: inline-flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  padding: 1rem;

  color: var(--color-text-primary);
  text-decoration: none;
}
.body:hover {
  background-color: rgba(0, 0, 0, 0.25);
}

.title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  font-size: 1em;
}

.airing-at {
  color: var(--color-text-secondary);
}

.rating {
  color: var(--color-warning);
  font-size: 1.15em;
}
.rating-text {
  color: var(--color-text-primary);
  font-size: 0.85em;
}

.synopsis-rating-value {
  margin: 1rem;
}`;