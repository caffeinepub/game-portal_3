import DomainExpansion from "@/components/DomainExpansion";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BreakoutGame from "@/games/BreakoutGame";
import CursedCourtGame from "@/games/CursedCourtGame";
import FlappyBirdGame from "@/games/FlappyBirdGame";
import Game2048 from "@/games/Game2048";
import HorrorGame from "@/games/HorrorGame";
import JJKBattleGame from "@/games/JJKBattleGame";
import MemoryMatch from "@/games/MemoryMatch";
import PongGame from "@/games/PongGame";
import SimonSaysGame from "@/games/SimonSaysGame";
import SnakeGame from "@/games/SnakeGame";
import SpaceInvadersGame from "@/games/SpaceInvadersGame";
import SurvivalGame from "@/games/SurvivalGame";
import TetrisGame from "@/games/TetrisGame";
import TicTacToeGame from "@/games/TicTacToeGame";
import WhackAMoleGame from "@/games/WhackAMoleGame";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  horror: "SURVIVE THE NIGHT",
  survival: "CURSED SURVIVAL",
  jjkbattle: "CURSED CLASH",
  basketball: "CURSED COURT",
};

export default function GamePage() {
  const { gameId } = useParams({ from: "/game/$gameId" });
  const navigate = useNavigate();
  const [showDomain, setShowDomain] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      gameContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
      case "horror":
        return <HorrorGame />;
      case "survival":
        return <SurvivalGame />;
      case "jjkbattle":
        return <JJKBattleGame />;
      case "basketball":
        return <CursedCourtGame />;
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
      <style>{`
        #game-fullscreen-container:fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          background: #0a0a0f !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: auto !important;
        }
        #game-fullscreen-container:-webkit-full-screen {
          width: 100vw !important;
          height: 100vh !important;
          background: #0a0a0f !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: auto !important;
        }
        #game-fullscreen-container:fullscreen > .fullscreen-inner {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        #game-fullscreen-container:-webkit-full-screen > .fullscreen-inner {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
      {showDomain && (
        <DomainExpansion
          gameId={gameId}
          onComplete={() => setShowDomain(false)}
        />
      )}
      <Header />
      <main>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 cursed-btn px-5 py-2 rounded font-cinzel text-xs tracking-widest uppercase"
              data-ocid="game.secondary_button"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO GAMES
            </button>
            <h1 className="font-cinzel font-black text-2xl md:text-3xl cursed-blue-text">
              {GAME_TITLES[gameId] ?? gameId.toUpperCase()}
            </h1>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 cursed-btn px-5 py-2 rounded font-cinzel text-xs tracking-widest uppercase w-36 justify-center"
              data-ocid="game.toggle"
            >
              <Maximize className="w-4 h-4" /> FULLSCREEN
            </button>
          </div>
          <div id="game-fullscreen-container" ref={gameContainerRef}>
            <div className="fullscreen-inner">{renderGame()}</div>
            {isFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex items-center gap-2 cursed-btn px-5 py-2 rounded font-cinzel text-xs tracking-widest uppercase"
                style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}
                data-ocid="game.secondary_button"
              >
                <Minimize className="w-4 h-4" /> EXIT FULL
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
