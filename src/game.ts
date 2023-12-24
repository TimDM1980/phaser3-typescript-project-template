import * as Phaser from "phaser";

// TODO
// beginscherm met keys en press to start
// game over scherm met winnaar en press space to play again
// score en player coloring
// random player dropping in
// audio prots random
// player prots
// basketball / drunk elephant png
// groter veld / centreren / fullscreen
// andere gravity?
// bounce weg
// eigen sprites
// 2 players blauw roze
// random stars erbij

const WIDTH = 800;
const HEIGHT = 600;
type PlayerName = 'ORANGE' | 'PINK';

export default class Demo extends Phaser.Scene {
  private playerOrange: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerPink: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private scoreTextOrange: Phaser.GameObjects.Text;
  private scoreTextPink: Phaser.GameObjects.Text;
  private scoreOrange = 0;
  private scorePink = 0;
  private stars: Phaser.Physics.Arcade.Group;
  private bombs: Phaser.Physics.Arcade.Group;
  private gameOver = false;

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
    this.add.image(400, 300, "sky");

    const platforms = this.physics.add.staticGroup();
    const ground = platforms.create(400, HEIGHT - 16, "ground");
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

    this.playerOrange = this.physics.add.sprite(300, 400, "dude");
    this.playerOrange.setCollideWorldBounds(true);
    this.playerOrange.setTint(0xff9900);
    this.playerOrange.setName('ORANGE');
    this.physics.add.collider(this.playerOrange, platforms);
    this.playerPink = this.physics.add.sprite(500, 400, "dude");
    this.playerPink.setCollideWorldBounds(true);
    this.playerPink.setTint(0xff00a6);
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
    // this.keyA = this.input.keyboard.addKey('A');

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

    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.bombs, platforms);
    this.physics.add.overlap(this.playerOrange, this.bombs, hitBomb, null, this);
    this.physics.add.overlap(this.playerPink, this.bombs, hitBomb, null, this);

    this.scoreTextOrange = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      color: "#ff9900",
    });
    this.scoreTextPink = this.add.text(600, 16, "Score: 0", {
      fontSize: "32px",
      color: "#ff00a6",
      align: "right",
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
      this.playerOrange.setVelocityX(-160);
      this.playerOrange.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.playerOrange.setVelocityX(160);
      this.playerOrange.anims.play("right", true);
    } else {
      this.playerOrange.setVelocityX(0);
      this.playerOrange.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.playerOrange.body.touching.down) {
      this.playerOrange.setVelocityY(-330);
    }

    // if (this.keyA?.isDown) {
    //   this.playerPink.setVelocityX(-160);
    //   this.playerPink.anims.play("left", true);
    // } else {
    //   this.playerPink.setVelocityX(0);
    //   this.playerPink.anims.play("turn");
    // }
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

  var x =
    player.x < 400
      ? Phaser.Math.Between(400, 800)
      : Phaser.Math.Between(0, 400);
  var bomb = this.bombs.create(x, 16, "bomb");
  bomb.setBounce(1);
  bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
}

function hitBomb(
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  bomb,
) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play("turn");
  this.gameOver = true;
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
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
