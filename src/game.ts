import * as Phaser from 'phaser';

// TODO
// eigen sprites
// refactor: remove duplication, extract classes, ...
// groter veld / centreren / fullscreen
// beginscherm met legende en keys en press J/Y/V to start
// game-over scherm met winnaar en press space to play again
// random stars erbij ipv wachten tot alle 10 weg
// bundle and deploy somewhere eg netlify or github pages

const WIDTH = 800;
const HEIGHT = 600;
const TINT_ORANGE = 0xff9900;
const TINT_PINK = 0xff00a6;

class Game extends Phaser.Scene {
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
  private gameOver = true;
  private vsPlay = false;
  private wsadKeys: {
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private configKeys: {
    J: Phaser.Input.Keyboard.Key;
    Y: Phaser.Input.Keyboard.Key;
    V: Phaser.Input.Keyboard.Key;
  };
  private farts: (Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound)[] = [];

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('ball', 'assets/ball.png');
    this.load.image('elephant', 'assets/elephant.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
      frameWidth: 32,
      frameHeight: 48,
    });

    this.load.audio('fart1', 'assets/fart1.mp3');
    this.load.audio('fart2', 'assets/fart2.mp3');
    this.load.audio('fart3', 'assets/fart3.mp3');
  }

  create() {
    this.farts.push(this.sound.add('fart1'));
    this.farts.push(this.sound.add('fart2'));
    this.farts.push(this.sound.add('fart3'));

    const sky = this.add.image(WIDTH / 2, HEIGHT / 2, 'sky');
    sky.displayWidth = WIDTH;
    sky.displayHeight = HEIGHT;

    const platforms = this.physics.add.staticGroup();
    const ground = platforms.create(WIDTH / 2, HEIGHT - 16, 'ground');
    ground.displayWidth = WIDTH;
    ground.refreshBody();
    const level1 = platforms.create(500, 450, 'ground');
    level1.displayWidth = 200;
    level1.refreshBody();
    platforms.create(50, 300, 'ground');
    platforms.create(880, 250, 'ground');
    const topPlatform = platforms.create(400, 150, 'ground');
    topPlatform.displayWidth = 160;
    topPlatform.refreshBody();

    this.playerOrange = this.physics.add.sprite(100, 400, 'dude');
    this.playerOrange.setCollideWorldBounds(true);
    this.playerOrange.setTint(TINT_ORANGE);
    this.playerOrange.setName('ORANGE');
    this.physics.add.collider(this.playerOrange, platforms);
    this.playerPink = this.physics.add.sprite(700, 400, 'dude');
    this.playerPink.setCollideWorldBounds(true);
    this.playerPink.setTint(TINT_PINK);
    this.playerPink.setName('PINK');
    this.physics.add.collider(this.playerPink, platforms);

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wsadKeys = this.input.keyboard.addKeys('W,S,A,D') as any;
    this.configKeys = this.input.keyboard.addKeys('J,Y,V') as any;

    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
    this.physics.add.collider(this.stars, platforms);
    this.physics.add.overlap(this.playerOrange, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.playerPink, this.stars, this.collectStar, null, this);
    this.stars.children.iterate((child: any) => child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)));

    this.playerOrangeBombs = this.physics.add.group();
    this.playerPinkBombs = this.physics.add.group();
    this.physics.add.collider(this.playerOrangeBombs, platforms);
    this.physics.add.collider(this.playerPinkBombs, platforms);
    this.physics.add.overlap(this.playerOrange, this.playerPinkBombs, this.hitBomb, null, this);
    this.physics.add.overlap(this.playerPink, this.playerOrangeBombs, this.hitBomb, null, this);

    this.scoreTextOrange = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#ff9900',
    });
    this.scoreTextPink = this.add.text(600, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#ff00a6',
    });
  }

  private collectStar(player, star) {
    star.disableBody(true, true);
    if (this.stars.countActive(true) === 0) {
      this.stars.children.iterate((child: any) => child.enableBody(true, child.x, 0, true, true));
    }

    if (player.name === 'ORANGE') {
      this.scoreOrange += 10;
      this.scoreTextOrange.setText('Score: ' + this.scoreOrange);
    } else {
      this.scorePink += 10;
      this.scoreTextPink.setText('Score: ' + this.scorePink);
    }

    this.throwBomb(player);
    this.farts[Phaser.Math.Between(0, 2)].play();
  }

  private throwBomb(player) {
    if (this.vsPlay) {
      const bombs = player.name === 'ORANGE' ? this.playerOrangeBombs : this.playerPinkBombs;
      const bomb = bombs.create(player.x, player.y, player.name === 'ORANGE' ? 'ball' : 'elephant');
      bomb.setVelocity(this.randomPosNegVelocity(Phaser.Math.Between(0, 1) === 0, 50, 150), -300);
      bomb.setBounce(0.9);
    } else {
      const bombs = player.name === 'ORANGE' ? this.playerPinkBombs : this.playerOrangeBombs;
      const deathFromAbove = player.x < WIDTH / 2 ? Phaser.Math.Between(WIDTH / 2, WIDTH) : Phaser.Math.Between(0, WIDTH / 2);
      const bomb = bombs.create(deathFromAbove, 16, player.name === 'ORANGE' ? 'elephant' : 'ball');
      bomb.setVelocity(this.randomPosNegVelocity(player.x > WIDTH / 2, 50, 150), 20);
      bomb.setBounce(0.9);
    }
  }

  private randomPosNegVelocity(posNegCondition: boolean, randomMin: number, randomMax: number) {
    return posNegCondition ? Phaser.Math.Between(randomMin, randomMax) : Phaser.Math.Between(-randomMax, -randomMin);
  }

  private hitBomb(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, bomb) {
    this.physics.pause();
    player.setTint(0x000000);
    player.anims.play('turn');
    this.gameOver = true;
  }

  update() {
    this.playerOrangeBombs.children.iterate((child: any) => (child.rotation += 0.05));
    this.playerPinkBombs.children.iterate((child: any) => (child.rotation += 0.05));

    if (this.gameOver) {
      if (this.cursors.space.isDown) {
        location.reload();
      }
      if (this.configKeys.J.isDown) {
        this.playerPink.disableBody(true, true);
        this.scoreTextPink.destroy();
        this.gameOver = false;
      }
      if (this.configKeys.Y.isDown) {
        this.playerOrange.disableBody(true, true);
        this.scoreTextOrange.destroy();
        this.gameOver = false;
      }
      if (this.configKeys.V.isDown) {
        this.vsPlay = true;
        this.gameOver = false;
      }
      return;
    }

    this.bindPlayerKeys(this.playerPink, {
      left: this.cursors.left,
      right: this.cursors.right,
      up: this.cursors.up,
    });
    if (this.vsPlay) {
      this.bindPlayerKeys(this.playerOrange, {
        left: this.wsadKeys.A,
        right: this.wsadKeys.D,
        up: this.wsadKeys.W,
      });
    } else {
      this.bindPlayerKeys(this.playerOrange, {
        left: this.cursors.left,
        right: this.cursors.right,
        up: this.cursors.up,
      });
    }
  }

  private bindPlayerKeys(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    keys: {
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      up: Phaser.Input.Keyboard.Key;
    },
  ) {
    if (keys.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (keys.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }
    if (keys.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  zoom: 1.5,
  scene: Game,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
