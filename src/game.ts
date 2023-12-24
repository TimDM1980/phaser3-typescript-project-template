import * as Phaser from "phaser";

// TODO

// basketball / drunk elephant png
// audio prots random
// eigen sprites

// refactor: remove duplication, extract classes, ...
// groter veld / centreren / fullscreen
// beginscherm met keys en press to start
// game over scherm met winnaar en press space to play again
// player drops in at random X
// andere gravity?
// random stars erbij

const WIDTH = 800;
const HEIGHT = 600;
const TINT_ORANGE = 0xff9900;
const TINT_PINK = 0xff00a6;

export default class Demo extends Phaser.Scene {
  private playerOrange: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerPink: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreTextOrange: Phaser.GameObjects.Text;
  private scoreTextPink: Phaser.GameObjects.Text;
  private scoreOrange = 0;
  private scorePink = 0;
  private stars: Phaser.Physics.Arcade.Group;
  private playerOrangeBombs: Phaser.Physics.Arcade.Group;
  private playerPinkBombs: Phaser.Physics.Arcade.Group;
  private gameOver = false;
  private wsadKeys: {
    W: Phaser.Input.Keyboard.Key,
    S: Phaser.Input.Keyboard.Key,
    A: Phaser.Input.Keyboard.Key,
    D: Phaser.Input.Keyboard.Key,
  };

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    const sky = this.add.image(WIDTH/2, HEIGHT/2, "sky");
    sky.displayWidth = WIDTH;
    sky.displayHeight = HEIGHT;

    const platforms = this.physics.add.staticGroup();
    const ground = platforms.create(WIDTH/2, HEIGHT - 16, "ground");
    ground.displayWidth = WIDTH;
    ground.refreshBody();
    const level1 = platforms.create(500, 450, "ground");
    level1.displayWidth = 200;
    level1.refreshBody();
    platforms.create(50, 300, "ground");
    platforms.create(880, 250, "ground");
    const topPlatform = platforms.create(400, 150, "ground");
    topPlatform.displayWidth = 160;
    topPlatform.refreshBody();

    this.playerOrange = this.physics.add.sprite(100, 400, "dude");
    this.playerOrange.setCollideWorldBounds(true);
    this.playerOrange.setTint(TINT_ORANGE);
    this.playerOrange.setName('ORANGE');
    this.physics.add.collider(this.playerOrange, platforms);
    this.playerPink = this.physics.add.sprite(700, 400, "dude");
    this.playerPink.setCollideWorldBounds(true);
    this.playerPink.setTint(TINT_PINK);
    this.playerPink.setName('PINK');
    this.physics.add.collider(this.playerPink, platforms);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wsadKeys = this.input.keyboard.addKeys('W,S,A,D') as any;

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
    this.physics.add.collider(this.stars, platforms);
    this.physics.add.overlap(this.playerOrange, this.stars, collectStar, null, this);
    this.physics.add.overlap(this.playerPink, this.stars, collectStar, null, this);
    this.stars.children.iterate((child: any) =>
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)),
    );

    this.playerOrangeBombs = this.physics.add.group();
    this.playerPinkBombs = this.physics.add.group();
    this.physics.add.collider(this.playerOrangeBombs, platforms);
    this.physics.add.collider(this.playerPinkBombs, platforms);
    this.physics.add.overlap(this.playerOrange, this.playerPinkBombs, hitBomb, null, this);
    this.physics.add.overlap(this.playerPink, this.playerOrangeBombs, hitBomb, null, this);

    this.scoreTextOrange = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      color: "#ff9900",
    });
    this.scoreTextPink = this.add.text(600, 16, "Score: 0", {
      fontSize: "32px",
      color: "#ff00a6",
    });
  }

  update() {
    if (this.cursors.space.isDown && this.gameOver) {
      location.reload();
    }
    if (this.gameOver) {
      return;
    }

    if (this.cursors.left.isDown) {
      this.playerPink.setVelocityX(-160);
      this.playerPink.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.playerPink.setVelocityX(160);
      this.playerPink.anims.play("right", true);
    } else {
      this.playerPink.setVelocityX(0);
      this.playerPink.anims.play("turn");
    }
    if (this.cursors.up.isDown && this.playerPink.body.touching.down) {
      this.playerPink.setVelocityY(-330);
    }

    if (this.wsadKeys.A.isDown) {
      this.playerOrange.setVelocityX(-160);
      this.playerOrange.anims.play("left", true);
    } else if (this.wsadKeys.D.isDown) {
      this.playerOrange.setVelocityX(160);
      this.playerOrange.anims.play("right", true);
    } else {
      this.playerOrange.setVelocityX(0);
      this.playerOrange.anims.play("turn");
    }
    if (this.wsadKeys.W.isDown && this.playerOrange.body.touching.down) {
      this.playerOrange.setVelocityY(-330);
    }
  }
}


function collectStar(player, star) {
  star.disableBody(true, true);
  if (player.name === 'ORANGE') {
    this.scoreOrange += 10;
    this.scoreTextOrange.setText("Score: " + this.scoreOrange);
  } else {
    this.scorePink += 10;
    this.scoreTextPink.setText("Score: " + this.scorePink);
  }

  if (this.stars.countActive(true) === 0) {
    this.stars.children.iterate((child) =>
      child.enableBody(true, child.x, 0, true, true),
    );
  }

  const bombs = player.name === 'ORANGE' ? this.playerOrangeBombs : this.playerPinkBombs;
  var bomb = bombs.create(player.x, player.y, "bomb");
  bomb.setTint(player.name === 'ORANGE' ? TINT_ORANGE : TINT_PINK);
  bomb.setBounce(1);
  bomb.setVelocity(randomVelocity(), randomVelocity());
}

function randomVelocity() {
  const positiveOrNegative = Phaser.Math.Between(0,1);
  if (positiveOrNegative) {
    return Phaser.Math.Between(100, 200);
  } else {
    return Phaser.Math.Between(-200, -100);
  }
}

function hitBomb(
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  bomb,
) {
  this.physics.pause();
  player.setTint(0x000000);
  player.anims.play("turn");
  this.gameOver = true;
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  zoom: 1.5,
  scene: Demo,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
