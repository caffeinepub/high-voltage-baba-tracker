import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";

actor {
  type CoordEntry = {
    id : Nat;
    timestamp : Int;
    coord : Text;
    username : Text;
  };

  module CoordEntry {
    public func compareByTimestampNewestFirst(entry1 : CoordEntry, entry2 : CoordEntry) : Order.Order {
      Int.compare(entry2.timestamp, entry1.timestamp);
    };
  };

  var nextId = 0;
  let entries = Map.empty<Nat, CoordEntry>();
  let coordIndex = Map.empty<Text, Nat>();

  public shared ({ caller }) func addEntry(timestamp : Int, coord : Text, username : Text) : async Nat {
    let entry : CoordEntry = {
      id = nextId;
      timestamp;
      coord;
      username;
    };
    entries.add(nextId, entry);
    coordIndex.add(coord, nextId);
    nextId += 1;
    nextId - 1;
  };

  public shared ({ caller }) func addMultipleEntries(inputEntries : [(Int, Text, Text)]) : async Nat {
    var count = 0;
    for ((timestamp, coord, username) in inputEntries.values()) {
      if (not coordIndex.containsKey(coord)) {
        let entry : CoordEntry = {
          id = nextId;
          timestamp;
          coord;
          username;
        };
        entries.add(nextId, entry);
        coordIndex.add(coord, nextId);
        nextId += 1;
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getAllEntries() : async [CoordEntry] {
    entries.values().toArray().sort(CoordEntry.compareByTimestampNewestFirst);
  };

  public shared ({ caller }) func removeEntry(id : Nat) : async () {
    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry does not exist.") };
      case (?entry) {
        entries.remove(id);
        coordIndex.remove(entry.coord);
      };
    };
  };
};
