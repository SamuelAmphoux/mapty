'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, dist, duration) {
    this.coords = coords; // [lat, lng]
    this.dist = dist; // km
    this.duration = duration; // min
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, dist, duration, cadence) {
    super(coords, dist, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.dist;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, dist, duration, elevationGain) {
    super(coords, dist, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.speed = this.dist / (this.duration / 60);
    return this.speed;
  }
}

// -----------------------------------------------------------------------------
// Application Architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkOut.bind(this));
    // Manage toggle between run workout and bike workout
    inputType.addEventListener('change', this.#toggleElevationField);
  }

  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  #loadMap(position) {
    // Display map centered at browser's current location
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 16);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkOut(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // Retrieving data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const dist = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(dist, duration, cadence) ||
        !allPositive(dist, duration, cadence)
      )
        return alert('Inputs must be positive numbers');

      workout = new Running([lat, lng], dist, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(dist, duration, elevation) ||
        !allPositive(dist, duration)
      )
        return alert('Inputs must be positive numbers');

      workout = new Cycling([lat, lng], dist, duration, elevation);
    }

    this.#workouts.push(workout);

    this.#renderWorkoutMarker(workout);

    // Clear input fields
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // Hide form
    form.classList.add('hidden');
  }

  #renderWorkoutMarker(workout) {
    // Display marker
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('Workout')
      .openPopup();
  }
}

const app = new App();
