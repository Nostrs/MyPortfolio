class waypoint {


    //costruttore dei waypoint
    constructor(x, y, offsetX, offsetY) {

        //raggio del cerchio del waypoint
        this.radius = 1.5;
        // vettore di posizione del waypoint (serve ai boid per trovare il waypoint)
        this.position = Matter.Vector.create(x + offsetX, y + offsetY);
        // x e y suvvia, non hai di certo bisogno din un commento per capire una cosa simile
        this.x = x;
        this.y = y;
        // opacità del waypoint inizialmente a 0 così la scritta è invisibile
        this.opacity = 0;
        this.fadeSpeed = 2;
        this.colorChangeSpeed = 10;
        this.colorHUE = 0;



        this.waypointBody = Matter.Bodies.circle(x + offsetX, y + offsetY, this.radius, {
            collisionFilter: {
                mask: 0x02
            },
            render: {
                fillStyle: "rgb(0,0,0,0)"
            }
        });

        Matter.World.add(engine.world, this.waypointBody);


    }

    resetOpacity() {
        this.opacity = 1;
        let increment = this.colorChangeSpeed;
        this.colorHUE += increment;
        if (this.colorHUE >= 256) {
            this.colorHUE = 0;

        }


        //this.waypointBody.render.fillStyle = "rgb(" + this.colorHUE + "," + this.g + "," + this.b + "," + this.opacity + ")";
        this.waypointBody.render.fillStyle = "hsla(" + this.colorHUE + ", 100%, 50%, " + this.opacity + ")";

    }

    discolor() {
        this.opacity -= 0.01 * this.fadeSpeed;
        this.waypointBody.render.fillStyle = "hsla(" + this.colorHUE + ", 100%, 50%, " + this.opacity + ")";
    }

    changePosition(posX, posY) {


        Matter.Body.setPosition(this.waypointBody, { x: posX, y: posY });
        this.position = Matter.Vector.create(posX, posY);
    }
}


function getRandomInt(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}




