
class Boid {


    constructor(x, y, world, waypoints) {
        //Regole allineamento
        // peso del vettore di allineamento
        this.alignWeight = 0.2;
        // Regole separazione
        //raggio dell cerchio di separazione
        this.separationRadius = 20;
        // peso del vettore diseparazione
        this.separationWeight = 0.2;

        this.maxSpeed = 0.3;
        this.maxRotation = 0.5;
        // Regole di coesione
        this.perceptionRadius = 50;
        this.cohesionWeight = 0.5;
        // Regole per seguire il mouse
        this.mouseFollowWeight = 0.1;
        this.mouseAvoidradius = 60;
        this.avoidCone = 60;
        // Variabili Utilitarie
        this.size = 5;
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 3;
        this.screenHeight = window.innerHeight;
        this.screenWidth = window.innerWidth;

        this.currentWaypointIndex = randomIntFromInterval(0, waypoints.length - 1);
        this.waypointRadius = 12;
        this.waypointWeight = 1;



        // Coordinate x e y per ogni vertice del triangolo isoscele
        var vertex1 = { x: this.size, y: 0 };
        var vertex2 = { x: -(this.size / 2), y: (this.size / 2) };
        var vertex3 = { x: -(this.size / 2), y: -(this.size / 2) };

        // CREAZIONE FORMA DEL BOID (Triangolo isoscele)
        // Array di vertici
        var vertices = [vertex1, vertex2, vertex3];
        // Creazione del corpo del boid (NB: è qua che viene dichiarata la variabile "boidBody"!, sarà usata molto piu avanti)
        this.boidBody = Matter.Bodies.fromVertices(x, y, vertices, {
            collisionFilter: {
                category: 0x0 + 'this.boidBody.position'
            },

            render: {
                fillStyle: getRandomColor(),
            },
        });
        // aggiunge il boid al mondo
        Matter.World.add(world, this.boidBody);

    }


    move() {
        // prende l'angolo del boid
        const angle = this.boidBody.angle;

        // Ne calcola la velocita in base alla sua angolazione 
        // Questa funzione, anche se piccola, governa il modo in cui il boid viene "comandato". questa funzione permette di comandare la direzione del boid cambiando il suo angolo
        const velocity = {
            x: this.speed * Math.cos(angle),
            y: this.speed * Math.sin(angle)
        };
        // e Settala sta velocity !
        Matter.Body.setVelocity(this.boidBody, velocity);
    }
    // Funzione che raggruppa tutte 3 le regole di comportamento dei boid in un unico loop (per una leggera ottimizzazione)
    boidBehavior(boids) {
        //cohesion variabili
        let nearbyBoids = [];
        //separation variabili
        let sum = { x: 0, y: 0 };
        let count = 0;
        let separationCount = 0;
        //align variabili
        let alignSum = 0;
        let alignCount = 0;

        let cohesionTorque = 0;

        /* array di boid filtrati in base a due criteri :
            1: se il boid non è se stesso
            2: se il boid è minore della distanza di percezione */
        nearbyBoids = boids.filter(boid => boid !== this && Matter.Vector.magnitude(Matter.Vector.sub(this.boidBody.position, boid.boidBody.position)) < this.perceptionRadius);

        // loop attraverso tutti i boid nel raggio di percezione
        for (let i = 0; i < nearbyBoids.length; i++) {
            // definisci chi è "l'altro boid" 
            const other = nearbyBoids[i];
            //COHESION ---
            //conteggio totale dei boid vicini per il calcolo della media
            count = nearbyBoids.length;
            // utilizza la funzione reduce() per sommare i vettori di tutti i boid nell'array "nearbyBoids" 
            // reduce: la funzione reduce() prima assegna il valore "Matter.Vector.Create(0,0)", poi accumula il valore della funzione Vector.add("totaleTemporaneo" + boid.position) e richiama la funzione per ogni boid fin quando l'array "nearbyBoids" è finito, dopo di chè ritorna il totale
            let totalPosition = nearbyBoids.reduce((total, boid) => Matter.Vector.add(total, boid.boidBody.position), Matter.Vector.create(0, 0));
            // media dei vettori per trovare la posizione media di tutti i boid vicini (dividere la somma di n. vettori per il numero di vettori ne ritorna la media)
            let averagePosition = Matter.Vector.div(totalPosition, count);
            // calcola il vettore di direzione (un vettore che "indica" la posizione media dei vettori)
            let Averagedirection = Matter.Vector.sub(averagePosition, this.boidBody.position);
            // calcolo dell angolazione del vettore di direzione, questo sarà l'angolo che il boid dovrà avere per essere indirizzato verso l'obbiettivo
            let Averageangle = Math.atan2(Averagedirection.y, Averagedirection.x);
            // calcola la differenza tra l'angolo del boid e l'angolo di direzione, poi limita questo valore secondo "maxRotation" ed in fine applica un peso per modificare il comportamento (ps: maxRotation evita rotazioni estreme del boid)
            cohesionTorque = Math.max(-this.maxRotation, Math.min(this.maxRotation, Averageangle - this.boidBody.angle)) * this.cohesionWeight;
            // FINE CALCOLI COHESION ---

            //SEPARATION
            // calcola il vettore di direzione sottraendo la posizione dell'altro boid con la poszione del boid attuale (si può immaginare come un vettore che dal nostro boid indica il l'altro boid)
            let direction = Matter.Vector.sub(other.boidBody.position, this.boidBody.position);
            // calcola la distanza tra questo boid ed l'altro boid in considerazione, calcolando la lunghezza(magnitudine) del vettore di direzione 
            const distance = Matter.Vector.magnitude(direction);
            // calcola l'angolo attuale del vettore di direzione, questo valore in radianti indica l'angolazione che il boid dovrà avere per indicare l'altro boid
            let dirAngle = Math.atan2(direction.y, direction.x);
            // mappa l'angolo in radianti portando il suo range da (-3.14,3.14) a (0,6+-)
            let angle = dirAngle;
            // calcola la differenza in angoli tra l'angolo del boid attuale con l'angolo del vettore di direzione calcolato precedentemente
            let angleDiff = Math.atan2(Math.sin(angle - this.boidBody.angle), Math.cos(angle - this.boidBody.angle));
            angleDiff = (mapAngle(angleDiff) * (180 / Math.PI)) - 180;


            //ALIGN -- !
            // somma gli angoli di tutti i boid che non sono quello attuale (serve per media direzione boid) (non centra con gli angoli calcolati precedentemente per la separazione)
            alignSum += other.boidBody.angle;
            alignCount++;

            //SEPARATION
            // filtra i boid in base a se sono all'interno della distanza massima per la separazione e se la differenza tra l'angolo attuale e l'angolo calcolato è maggiore del campo 
            if (distance < this.separationRadius && (angleDiff < this.avoidCone / 2 || angleDiff > -this.avoidCone / 2)) {

                // Creazione del vettore di repulsione sottraendo il vettore di movimento del boid attuale con il vetoore di mov. del boid preso in considerazione
                const vector = Matter.Vector.sub(this.boidBody.position, other.boidBody.position);
                //Normalizza vettore di repulsione
                Matter.Vector.normalise(vector);
                // moltiplica il vettore per il peso di separazione
                Matter.Vector.mult(vector, this.separationWeight);
                // divide il vettore per la distanza così da fornire valori di repulsione più alti per ostacoli più vicini
                Matter.Vector.div(vector, distance);
                // somma i vettori assieme e aggiorna il conto ( servirà per la media )
                sum = Matter.Vector.add(sum, vector);
                //aumenta il conteggio di corpo dai quali separarsi
                separationCount++;
            }

        }

        // Se il numero di boid con cui allinearsi è maggiore di 0
        //ALING
        if (alignCount > 0) {
            // media
            const averageAngle = alignSum / alignCount;
            // "Delta" ovvero la differenza tra la media e l'angolo del singolo boid
            const angleDelta = averageAngle - this.boidBody.angle;
            // calcolo del nuovo angolo
            const newAngle = this.boidBody.angle + (angleDelta * this.alignWeight);
            // Setta l'angolo di allineamento
            Matter.Body.setAngle(this.boidBody, newAngle);
            // setta una parte dell angolo come velocita angolare, così il boid ruoterà verso l'obbiettivo al posto di "scattare"
            Matter.Body.setAngularVelocity(this.boidBody, cohesionTorque * this.cohesionWeight);

        }

        //SEPARATION 
        if (separationCount > 0) {

            // media dei vettori
            Matter.Vector.div(sum, separationCount);
            // normalizza il nuovo vettore (porta il suo valore a 1)
            Matter.Vector.normalise(sum);
            // moltiplica il vettore normalizzato per la velocità massima, proprietà aggiunta per modificare a piacimento il comportamento dei boid
            Matter.Vector.mult(sum, this.maxSpeed);

            if (sum) {
                // calcolo dell'angolo del vettore di repulsione, questo sarà l'angolo che il boid dovrà avere per essere in linea con il vetoore di repulsione
                let angle = Math.atan2(sum.y, sum.x);
                // differenza tra l'angolo attuale e l'angolo desiderato, così si ottinere la quantità di angolazione necessaria per separarsi
                let separationTorque = angle - this.boidBody.angle;
                // setta la velocita angolare per la separazione, moltiplicato dal peso per attenuare la rotazione
                Matter.Body.setAngularVelocity(this.boidBody, separationTorque * this.separationWeight);
            }

        }

    }

    // Funzione che permette ai boid di seguire la posizione del mouse
    followMouse(mousePosition) {
        // Posizione attuale del boid
        let boidPosition = this.boidBody.position;
        // Vettore che indica la direzione che il boid deve seguire 
        let direction = Matter.Vector.sub(mousePosition, boidPosition);
        // Controlla se la lunghezza del vetoore di direzione è maggiore del raggio di esclusione del mouse, questo per evitare che i boid raggiungano la posizione esatta del mouse così da ottenere un "effetto orbita"
        if (Matter.Vector.magnitude(direction) > this.mouseAvoidradius) {
            // Calcola l'angolo del vettore di direzione
            let angle = Math.atan2(direction.y, direction.x);

            // mappa l'angolo tra un valore di 0 e 6 così da evitare numeri negativi
            angle = mapAngle(angle);
            // Calcola la differenza tra angolo attuale del boid (mappato) e l'angolo desiderato
            let angleDiff = Math.atan2(Math.sin(angle - mapAngle(this.boidBody.angle)), Math.cos(angle - mapAngle(this.boidBody.angle)));
            // la differenza viene notevolemnte ridotta per fornire una rotazione graduale
            let angularVelocity = angleDiff * this.mouseFollowWeight;
            // la differenza viene sommata all'angolo attuale del boid e l'angolo viene applicato
            Matter.Body.setAngle(this.boidBody, this.boidBody.angle + angularVelocity);
        }
    }

    // Funzione che impedisce ai boid di andare oltre lo spazio dello schermo
    screenRespawn() {
        // controllo posizione X dei boid
        if (this.boidBody.position.x > this.screenWidth) {
            Matter.Body.setPosition(this.boidBody, { x: 0, y: this.boidBody.position.y })
        } else if (this.boidBody.position.x < 0) {
            Matter.Body.setPosition(this.boidBody, { x: this.screenWidth, y: this.boidBody.position.y })
        }
        // controllo posizione Y dei boid
        if (this.boidBody.position.y > this.screenHeight) {
            Matter.Body.setPosition(this.boidBody, { x: this.boidBody.position.x, y: 0 })
        } else if (this.boidBody.position.y < 0) {
            Matter.Body.setPosition(this.boidBody, { x: this.boidBody.position.x, y: this.screenHeight })
        }

    }


    // Funzione che permette ai boid di seguire i waypoint in successione
    followWaypoints(waypoints) {
        // er target (modo poco pratico di chiamare il waypoint attuale)
        let target = waypoints[this.currentWaypointIndex].position;

        if (Matter.Vector.magnitude(Matter.Vector.sub(target, this.boidBody.position)) < this.waypointRadius) {
            // Funzione della classe Waypoint che resetta l'opacità e cambia leggermente il colore del waypoint
            waypoints[this.currentWaypointIndex].resetOpacity();
            // Se l'indice del bersaglio attuale è uguale all'ultimo indice dell'array:
            if (this.currentWaypointIndex === waypoints.length - 1) {
                // imposta l'indice del bersaglio attuale a 0 così da ricominciare il loop di tutti i waypoint
                this.currentWaypointIndex = 0;
            }
            else {
                // Avanza di waypoint (vai al successivo)
                this.currentWaypointIndex++;
            }
        }
        // Calcola la direzione verso il waypoint target
        let direction = Matter.Vector.sub(target, this.boidBody.position);
        // normalizza la direzione (porta il valore del vettore = 1)
        Matter.Vector.normalise(direction);
        // Moltiplica il vettore di direzione (=1) per la velocità massima, così il vettore di direzione aumenta proporzionalmente alla velocita
        Matter.Vector.mult(direction, this.maxSpeed);
        // calolca l'angolazione del vettore
        let angle = Math.atan2(direction.y, direction.x);
        // calolca la differenza tra l'angolo del boid attuale a l'angolo del vettore calcolato
        let torque = angle - this.boidBody.angle;
        // imposta la velocta angolare moltiplicata per un valore di attenuazione
        Matter.Body.setAngularVelocity(this.boidBody, torque * this.waypointWeight);
    }

    // Funzione che applica una forza casuale ai boid
    randomForce() {

        // apllica una forza di direzione casuale al boid
        // Matter.Body.applyForce(this.boidBody, this.boidBody.position, { x: Math.random() * 0.01 - 0.005, y: Math.random() * 0.01 - 0.005 });

        Matter.Body.rotate(this.boidBody, randomIntFromInterval(-Math.PI, Math.PI))

    }

}

function mapAngle(angle) {
    return (angle + Math.PI) % (2 * Math.PI)
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}


