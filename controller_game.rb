require_relative 'model_board'

class Game

	attr_reader :board, :players

	def initialize(size)
		@players = {}
		@available_colors = ["red", "orange", "yellow", "green", "blue", "purple"]
		@board = Board.new(size)
	end

	def add_player(player)
		@players[player] = @available_colors.shift
	end

	def remove_player(player)
		@players.delete(player)
	end

end