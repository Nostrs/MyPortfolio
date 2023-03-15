

window.addEventListener("load", function () {



    // Variabili Generali
    let screenWidth = this.window.innerWidth;
    let screenHeight = this.window.innerHeight;
    let mousePosition = { x: screenWidth / 2, y: screenHeight / 2 };
    let boidState = "intro";

    // Variabili creazione boid
    let numOfBoids = 300;



    // Semplificazione / creazione alias per MatterJs
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Body = Matter.Body,
        World = Matter.World,
        Composite = Matter.Composite;


    // Crea il motore per la simulazione
    engine = Engine.create();


    // Crea il renderer della grandezza del  ( finestra in cui la simulazione si terrà)
    var render = Render.create({
        element: document.body,
        canvas: this.document.getElementById('canvas'),
        engine: engine,

        options: {
            width: screenWidth,
            height: screenHeight,
            wireframes: false,

        },
    });

    engine.world.gravity.y = 0;


    var boids = [];


    // Fa Girare il renderer
    Render.run(render);

    // Crea runner
    var runner = Runner.create();

    // Fa Attiva il renderer
    Runner.run(runner, engine);

    // Aggiorna la variabile di posizione del mouse ad ogni suo movimento
    document.addEventListener("mousemove", (event) => {
        mousePosition = { x: event.clientX, y: event.clientY };
    });

    // Pulsante di inizio
    const pulsantePrincipale = document.getElementById('startButtonContainer');

    // PATH MAKER
    // recupera il tracciato svg
    var path = this.document.getElementById('path');
    // dichiara le variabili utilizzate per il tracciato
    var pathOffsetX = (this.innerWidth / 2) - (445 / 2);
    var rect = pulsantePrincipale.getBoundingClientRect();
    var pathOffsetY = rect.top / 3;
    let pathDensity = 5; // Inversalmente Proporzionale


    // Tracciato , offest x e y del tracciato, densità waypoints nel tracciato, mostra waypoints
    let waypoints = makeWaypoints(path, pathOffsetX, pathOffsetY, pathDensity);

    // Crea Boids in Linea con il tracciato e li aggiunge all'array dei boids

    let distanzaSpawn = 500;
    let angoloSpawn = 0;

    for (let i = 0; i <= numOfBoids; i++) {
        angoloSpawn += 0.5;
        let x = distanzaSpawn * Math.cos(angoloSpawn);
        let y = distanzaSpawn * Math.sin(angoloSpawn);

        boids.push(new Boid(this.innerWidth / 2 + x * (100 / i + 2), this.innerHeight / 2 + y, engine.world, waypoints));
    }



    // ascolta per la pressione del pulsante per cambiare stato
    pulsantePrincipale.addEventListener('click', () => {

        boids.forEach(Boid => {
            Boid.randomForce();
        });
        boidState = "default";
    });



    // LOOP PER MOVIMENTO e rendering
    setInterval(() => {

        //per ogni boid nell'array boids:
        boids.forEach(Boid => {

            // Controlla stato attuale
            switch (boidState) {
                case "intro":
                    // segui i waypoint 
                    Boid.followWaypoints(waypoints);
                    break;

                case "default":
                    //Segui il mouse
                    Boid.followMouse(mousePosition);
                    // Comportati come un boid ! 
                    Boid.boidBehavior(boids);
                    // Respawna se vai oltre lo schermo
                    Boid.screenRespawn();

                    break;
            }
            Boid.move();

            // per ogni waypoint 


        });
        // Allinea i boid
        waypoints.forEach(waypoint => {
            // togli una percentuale di opacità
            waypoint.discolor();
        });


    }, 1000 / 60);

    window.addEventListener("resize", function () { updateResizeRender(render, boids, waypoints) });


});



// Funzione che crea i waypoint in base alle coordinate dei punti nel tracciato
function makeWaypoints(path, pathOffsetX, pathOffsetY, pathDensity) {
    // prende la lunghezza totale del tracciato
    var pathLength = Math.floor(path.getTotalLength());
    // crea array di waypoints
    let waypoints = [];
    //per ogni waypoint nell'array / la densità del tracciato
    for (let i = 0; i < pathLength / pathDensity; i++) {
        // prende il punto in cui il waypoint dovrebbe essere situato
        point = path.getPointAtLength(i * pathDensity);
        // crea un nuovo waypoint in questo punto e lo aggiunge all'array
        waypoints.push(new waypoint(point.x, point.y, pathOffsetX, pathOffsetY));
    }

    return waypoints;
}

// variabile che serve per aggiornare la posizione dei waypoint
var oldWindowWidth = window.innerWidth;

// funzione che cambia le dimensioni del render e di conseguenza :
// cambia le barriere di respawn per i boid e le posizioni dei waypoint

function updateResizeRender(renderer, boidsArray, waypointsArray) {
    // cambio dimensioni render
    renderer.canvas.width = window.innerWidth;
    renderer.canvas.height = window.innerHeight;
    renderer.bounds.max.x = window.innerWidth;
    renderer.bounds.max.y = window.innerHeight;

    //cambio dimensioni barriere di respawn dei boid
    boidsArray.forEach(boid => {
        boid.screenHeight = window.innerHeight;
        boid.screenWidth = window.innerWidth;
    });

    // calcola la differenza tra le dimensioni dello schermo attuali e quelle di prima
    difference = window.innerWidth - oldWindowWidth;


    waypointsArray.forEach(waypoint => {

        // divido la differenza per due, questo serve per mantenere la posizione centrata
        let pathsetX = difference / 2;
        // oops!, non aggiorna la posizione Y (LA LAVORARCI SOPRA)
        let pathsetY = 0;

        waypointPos = waypoint.position;
        waypoint.changePosition(pathsetX + waypointPos.x, pathsetY + waypointPos.y);
        oldWindowWidth = window.innerWidth;

    });

}
