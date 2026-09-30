-- Helpers used by the Tibia 7.4 map scripts (server/data/scripts/classic74),
-- ported from the 7.4 datapack's lib/core/game.lua. Item ids passed to them are
-- Client IDs, like everywhere else in this server.
-- Unlike the 7.4 originals, a missing tile or item returns false instead of
-- raising an error, so a lever keeps working if a map piece is missing.

function Game.isItemInPosition(position, itemId)
	local tile = Tile(position)
	return tile ~= nil and tile:getItemById(itemId) ~= nil
end

function Game.removeItemInPosition(position, itemId)
	local tile = Tile(position)
	local item = tile and tile:getItemById(itemId)
	if not item then
		return false
	end
	item:remove()
	return true
end

-- Removes every movable item on the tile.
function Game.removeItemsInPosition(position)
	local tile = Tile(position)
	if not tile then
		return false
	end
	for _, item in ipairs(tile:getItems() or {}) do
		if ItemType(item:getId()):isMovable() then
			item:remove()
		end
	end
	return true
end

function Game.transformItemInPosition(position, fromItemId, toItemId)
	local tile = Tile(position)
	local item = tile and tile:getItemById(fromItemId)
	if not item then
		return false
	end
	item:transform(toItemId)
	item:decay()
	return true
end

function Game.setMapItemActionId(position, itemId, actionId)
	local tile = Tile(position)
	local item = tile and tile:getItemById(itemId)
	if not item then
		return false
	end
	item:setActionId(actionId)
	return true
end

function Game.sendMagicEffect(position, effect)
	Position(position.x, position.y, position.z):sendMagicEffect(effect)
end
