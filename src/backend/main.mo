import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import List "mo:core/List";

actor {
  type Score = {
    playerName : Text;
    score : Nat;
    timestamp : Time.Time;
  };

  module Score {
    public func compare(a : Score, b : Score) : Order.Order {
      Nat.compare(b.score, a.score);
    };
  };

  let gameScores = Map.empty<Text, List.List<Score>>();

  public shared ({ caller }) func submitScore(game : Text, playerName : Text, score : Nat) : async () {
    let newScore : Score = {
      playerName;
      score;
      timestamp = Time.now();
    };

    let currentScores = switch (gameScores.get(game)) {
      case (null) { List.empty<Score>() };
      case (?scores) { scores };
    };

    currentScores.add(newScore);
    let scoreArray = currentScores.toArray().sort().sliceToArray(0, Nat.min(10, currentScores.size()));
    gameScores.add(game, List.fromArray<Score>(scoreArray));
  };

  public query ({ caller }) func getTopScores(game : Text) : async [Score] {
    switch (gameScores.get(game)) {
      case (null) { [] };
      case (?scores) { scores.toArray().sort() };
    };
  };

  public query ({ caller }) func getAllGameScores() : async [(Text, [Score])] {
    gameScores.entries().toArray().map(func(entry) { (entry.0, entry.1.toArray().sort()) });
  };

  public shared ({ caller }) func clearScores() : async () {
    let entries = gameScores.entries();
    for ((gameName, _) in entries) {
      gameScores.add(gameName, List.empty<Score>());
    };
  };
};
