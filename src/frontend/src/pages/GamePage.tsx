import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BreakoutGame from "@/games/BreakoutGame";
import FlappyBirdGame from "@/games/FlappyBirdGame";
import Game2048 from "@/games/Game2048";
import MemoryMatch from "@/games/MemoryMatch";
import PongGame from "@/games/PongGame";
import SimonSaysGame from "@/games/SimonSaysGame";
import SnakeGame from "@/games/SnakeGame";
import SpaceInvadersGame from "@/games/SpaceInvadersGame";
import TetrisGame from "@/games/TetrisGame";
import TicTacToeGame from "@/games/TicTacToeGame";
import WhackAMoleGame from "@/games/WhackAMoleGame";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const GAME_TITLES: Record<string, string> = {
  snake: "SNAKE",
  tictactoe: "TIC-TAC-TOE",
  memory: "MEMORY MATCH",
  breakout: "BREAKOUT",
  tetris: "TETRIS",
  pong: "PONG",
  spaceinvaders: "SPACE INVADERS",
  flappy: "FLAPPY BIRD",
  "2048": "2048",
  whackmole: "WHACK-A-MOLE",
  simon: "SIMON SAYS",
};

export default function GamePage() {
  const { gameId } = useParams({ from: "/game/$gameId" });
  const navigate = useNavigate();

  const renderGame = () => {
    switch (gameId) {
      case "snake":
        return <SnakeGame />;
      case "tictactoe":
        return <TicTacToeGame />;
      case "memory":
        return <MemoryMatch />;
      case "breakout":
        return <BreakoutGame />;
      case "tetris":
        return <TetrisGame />;
      case "pong":
        return <PongGame />;
      case "spaceinvaders":
        return <SpaceInvadersGame />;
      case "flappy":
        return <FlappyBirdGame />;
      case "2048":
        return <Game2048 />;
      case "whackmole":
        return <WhackAMoleGame />;
      case "simon":
        return <SimonSaysGame />;
      default:
        return (
          <div className="text-center py-20">
            <p className="font-orbitron text-xl neon-magenta-text">
              GAME NOT FOUND
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 neon-btn-cyan px-5 py-2 rounded font-orbitron text-xs tracking-widest uppercase"
              data-ocid="game.secondary_button"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO GAMES
            </button>
            <h1 className="font-orbitron font-black text-2xl md:text-3xl neon-cyan-text">
              {GAME_TITLES[gameId] ?? gameId.toUpperCase()}
            </h1>
            <div className="w-36" />
          </div>
          {renderGame()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
