

// Clase para crear un contenedor
class Contenedor {
    constructor(id, clases, contenedorPadre) {
        this.contenedor = document.createElement('div');
        this.contenedor.id = id;
        if (clases.length > 0) {
            this.contenedor.classList.add(...clases);
        }
        contenedorPadre.appendChild(this.contenedor);
    }
}

// Clase para crear botones
class Boton {
    constructor(texto, id, clases, contenedorPadre, funcion) {
        this.boton = document.createElement('button');
        this.boton.id = id;
        this.boton.innerText = texto;
        if (clases.length > 0) {
            this.boton.classList.add(...clases);
        }
        contenedorPadre.appendChild(this.boton);
        if (funcion) {
            this.boton.addEventListener('click', funcion);
        }
    }

    mostrar() {
        this.boton.classList.remove('oculto');
    }

    ocultar() {
        this.boton.classList.add('oculto');
    }
}

// Contenedores
const contenedorTrivia = new Contenedor('contenedor-trivia', [], document.body);
const contenedorPregunta = new Contenedor('contenedor-pregunta', ['oculto'], contenedorTrivia.contenedor);
const contenedorBotonesRespuesta = new Contenedor('contenedor-botones-respuesta', ['contenedor-botones'], contenedorPregunta.contenedor);

// Botones
const botonIniciar = new Boton('Iniciar Trivia', 'boton-iniciar', ['btn'], contenedorTrivia.contenedor, obtenerPreguntas);
const botonSiguiente = new Boton('Siguiente pregunta', 'boton-siguiente', ['btn', 'oculto'], contenedorPregunta.contenedor, mostrarSiguientePregunta);
const botonFinalizar = new Boton('Finalizar', 'boton-finalizar', ['btn', 'oculto'], contenedorPregunta.contenedor, finalizarTrivia);

// Elemento para mostrar la pregunta
const textoPreguntaH2 = document.createElement('h2');
textoPreguntaH2.id = 'pregunta';
contenedorPregunta.contenedor.appendChild(textoPreguntaH2);

let indicePreguntaActual = 0;
let preguntas = [];
let puntaje = parseInt(localStorage.getItem('puntaje')) || 0;


// Función para obtener preguntas de la API
async function obtenerPreguntas() {
    try {
        const respuestaApi = await fetch('https://opentdb.com/api.php?amount=5&language=es');
        if (!respuestaApi.ok) {
            throw new Error('Error al obtener las preguntas');
        }

        const datos = await respuestaApi.json();

        // Convertir las preguntas de la API 
        preguntas = datos.results.map(preguntaAPI => {
            return {
                pregunta: preguntaAPI.question,
                respuestas: [
                    ...preguntaAPI.incorrect_answers.map(incorrecta => ({ texto: incorrecta, correcto: false })),
                    { texto: preguntaAPI.correct_answer, correcto: true }
                ].sort(() => Math.random() - 0.5) // Mezclar las respuestas para que no siempre esté la correcta en el mismo lugar.
            };
        });

        // Iniciar la trivia cundo cargan las preguntas
        iniciarTrivia();
    } catch (error) {
        console.error('Error al cargar las preguntas:');
        textoPreguntaH2.innerText = 'Hubo un problema al cargar las preguntas. Inténtalo de nuevo más tarde.';
    }
}

// Función para iniciar la trivia
function iniciarTrivia() {
    botonIniciar.ocultar();
    contenedorPregunta.contenedor.classList.remove('oculto');
    indicePreguntaActual = 0;
    mostrarSiguientePregunta();
}

// Reiniciar el estado para la siguiente pregunta
function reiniciarEstado() {
    botonSiguiente.ocultar();
    textoPreguntaH2.innerText = ``;
    while (contenedorBotonesRespuesta.contenedor.firstChild) {
        contenedorBotonesRespuesta.contenedor.removeChild(contenedorBotonesRespuesta.contenedor.firstChild);
    }
}

// Mostrar la siguiente pregunta
function mostrarSiguientePregunta() {
    reiniciarEstado();
    if (indicePreguntaActual < preguntas.length) {
        mostrarPregunta(preguntas[indicePreguntaActual]);
    }
}

// Mostrar la pregunta
function mostrarPregunta(parametroMostrarPregunta) {
    textoPreguntaH2.innerText = parametroMostrarPregunta.pregunta;
    parametroMostrarPregunta.respuestas.forEach(respuesta => {
        const boton = document.createElement('button');
        boton.innerText = respuesta.texto;
        boton.classList.add('btn');
        if (respuesta.correcto) {
            boton.dataset.correcto = respuesta.correcto;
        }
        boton.addEventListener('click', seleccionarRespuesta);
        contenedorBotonesRespuesta.contenedor.appendChild(boton);
    });

    indicePreguntaActual++;
}

// Seleccionar una respuesta
function seleccionarRespuesta(respuestaSeleccionada) {
    const botonSeleccionado = respuestaSeleccionada.target;
    const esCorrecta = botonSeleccionado.dataset.correcto === 'true';

    // Deshabilitar los botones para evitar múltiples selecciones
    Array.from(contenedorBotonesRespuesta.contenedor.children).forEach(boton => {
        boton.removeEventListener('click', seleccionarRespuesta);
    });

    if (esCorrecta) {
        botonSeleccionado.classList.add('correcto');
        botonSeleccionado.innerText += " ✔ Correcto";
        puntaje++;
        localStorage.setItem('puntaje', JSON.stringify(puntaje));
    } else {
        botonSeleccionado.classList.add('incorrecto');
        botonSeleccionado.innerText += " ✘ Incorrecto";
    }

    // Mostrar el botón "Siguiente" si hay más preguntas
    if (preguntas.length > indicePreguntaActual) {
        botonSiguiente.mostrar();
    } else {
        botonFinalizar.mostrar();
    }
}


// Función para reiniciar la trivia
function reiniciarTrivia() {
    puntaje = 0;
    indicePreguntaActual = 0;
    localStorage.setItem('puntaje', JSON.stringify(puntaje));
    obtenerPreguntas(); 
}


// Función para finalizar la trivia usando SweetAlert con un botón de reinicio
function finalizarTrivia() {
    reiniciarEstado();
    botonFinalizar.ocultar();

    // SweetAlert para mostrar el puntaje final y un botón para reiniciar
    Swal.fire({
        title: '¡Trivia Finalizada!',
        text: `Gracias por participar. Tu puntaje es: ${puntaje}`,
        icon: 'success',
        showCancelButton: true, 
        confirmButtonText: 'Finalizar',
        cancelButtonText: 'Reiniciar',
        allowOutsideClick: false,
    }).then((result) => {
        if (result.isConfirmed) {
            
            Swal.fire('¡Gracias!', 'Has finalizado la trivia.', 'success');
            puntaje = 0;
            localStorage.setItem('puntaje', JSON.stringify(puntaje));
        } else if (result.dismiss) {
          
            reiniciarTrivia();
        }
    });
}



