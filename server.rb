require 'socket'
require 'thread'
require_relative 'controller_game'

# Create an instance of the Game class
game = Game.new(size = 8)
puts('Game object instantiated.')

# Create the server socket
server = TCPServer.new('localhost', 1234)
puts('Server listening for clients (players) on port 1234...')

# Create a flag to indicate whether the server should keep running
running = true

# Run the server in a loop until the running flag is set to false
while running
  Thread.start(server.accept) do |client|
    # Handle client connection
    game.add_player(client)
    puts("Client (player) connected: #{client.peeraddr}")
    puts("Players in game: #{game.players}")

    client.puts("You are connected to the game.")
    client.puts("Your assigned color is #{game.players[client]}")

    keep_alive = true

    while keep_alive
      client.puts("Your turn to move. To quit, send 'end'.")

      request_line = client.gets
      client.puts("Your move was #{request_line}")
      puts("Client (player) #{client.peeraddr} (#{game.players[client]} player) moved #{request_line}")

      if request_line.chomp == 'end'
        keep_alive = false
      end
    end
    puts("Client (player) #{client.peeraddr} (#{game.players[client]} player) has left the game.")
    game.remove_player(client)
    client.close
    puts("Players in game: #{game.players}")
  end

end
