var GGB = {
    page: undefined,
    gameboard: undefined,
    configTiles: undefined,
    savedBoards: undefined
};

GGB.page = {
    init: function () {
        // Attach events for header
        $('#gg-logo, #bingo-logo').on('click', function () {
            GGB.gameboard.doShow();
            GGB.page.doToggleMenu(false);
        });
        $('#btn-menu, #btn-menu-back').on('click', function () {
            GGB.page.doToggleMenu();
        });
        $('#btn-config').on('click', function () {
            GGB.configTiles.doShow();
            GGB.page.doToggleMenu(false);
        });
        $('#btn-saved').on('click', function () {
            GGB.savedBoards.doShow();
            GGB.page.doToggleMenu(false);
        });
        $('#btn-share').on('click', function () {
            GGB.configTiles.doShare();
            GGB.page.doToggleMenu(false);
        });
        $('#btn-reset').on('click', function () {
            if (confirm("Reset will delete all saved gameboards and reload the page resetting the current config. Continue?")) {
                localStorage.clear();
                window.location = window.location.href.split('?')[0];
            }
        });
        $('#btn-about').on('click', function () {
            GGB.page.doShowAbout();
            GGB.page.doToggleMenu(false);
        });
    },
    doToggleMenu: function (isShow) {
        $('#header-menu-popup').toggle(isShow);
    },
    doShowAbout: function () {
        GGB.page.doShowContentBody('#about-wrapper');
    },
    doShowContentBody: function (contentBodyId) {
        $('.content-body').hide().filter(contentBodyId).show();
    }
};

GGB.gameboard = {
    data: {},

    init: function () {
        // Events
        $('#gameboard').on('change', '#gameboard-name', function () {
            GGB.savedBoards.data.forEach(el => el.default = false);
            GGB.gameboard.data = $(this).find(':selected').data('item');
            GGB.gameboard.data.default = true;
            GGB.savedBoards.doSave(GGB.gameboard.data);
            GGB.gameboard.doRefreshBody();
        });
        $('#gameboard').on('click', 'td', function () {
            GGB.gameboard.doToggleSquare(this);
            GGB.gameboard.doWinCheck();
        });
        $('#gameboard-clear').on('click', function () {
            GGB.gameboard.doClear();
        });
        $('#win-wrapper').on('click', function () {
            GGB.gameboard.doWin(false);
        });

        // Rebuild board
        GGB.gameboard.doShow();
    },
    getDefaultTile: function () {
        return {
            title: "Arin does something"
        };
    },
    getDefaultBoard: function () {
        return {
            name: 'Power Hour!',
            //img: 'images/gg_bg.jpg',
            tiles: [
                // Arin
                { title: "Arin puts something in his mouth", free: true },
                { title: "Arin wins" },
                { title: "Arin breaks something" },
                { title: "Arin drools" },
                { title: "Arin gets something thrown at him" },

                // Dan
                { title: "Dan wins" },
                { title: "Dan ties his hair up" },
                { title: "Dan leans on arin laughing" },
                { title: "Dan mentions a band" },
                { title: "Dan blank stare" },

                // Others
                { title: "Suzy!" },
                { title: "Ross!" },
                { title: "Allie!" },
                { title: "Reluctant participant" },
                { title: "Guest grumps" },

                // Situation
                { title: "Sticky substance on face" },
                { title: "Belly Reveal" },
                { title: "Singing together" },
                { title: "Someone in pain" },
                { title: "The cheese is mentioned" },
                { title: "Item not used for inteneded purpose" },
                { title: "Crew asked a question" },

                // Episodic
                { title: "Out of the office" },
                { title: "Versus Episode" },
                { title: "Table is messed up" }
            ]
        };
    },
    doToggleSquare: function (sender) {
        sender.classList.toggle('checked');
    },
    doShow: function () {
        GGB.gameboard.doRefresh();
        GGB.page.doShowContentBody('#gameboard-wrapper');
    },
    doLoad: function (data) {
        GGB.gameboard.data = data;
        GGB.gameboard.doRefresh();
    },
    doRefresh: function () {
        // Title
        var titleList = $('#gameboard-name').empty();
        var boardList = GGB.savedBoards.data.filter(v => !!v.name);

        // If a loaded board is not saved, add it to the dropdown 
        // FIX: Is lost if you switch boards and return to the gameboard
        if (GGB.gameboard.data && GGB.gameboard.data.name && boardList.filter(el => el.name == GGB.gameboard.data.name).length == 0) {
            boardList.unshift(GGB.gameboard.data);
        }
        // If no board is loaded, load default saved board
        else if (!GGB.gameboard.data) {
            boardList.filter(el => !!el.default).forEach(el => GGB.gameboard.data = el);
        }

        boardList.forEach(el => $('<option>').text(el.name).prop('selected', (el.name == GGB.gameboard.data.name)).data('item', el).appendTo(titleList));
        titleList.toggleClass('single', (boardList.length <= 1));
        GGB.gameboard.data = titleList.find(':selected').data('item');

        // Grid
        GGB.gameboard.doRefreshBody();
    },
    doRefreshBody: function () {
        // Ignore tiles with no title
        var availableTiles = (GGB.gameboard.data ? $(GGB.gameboard.data.tiles).filter((i, el) => !!el.title) : []);

        // Get normal tiles
        var normalTiles = availableTiles.filter((i, el) => !el.free);

        // Get free tiles
        var freeTiles = availableTiles.filter((i, el) => !!el.free);

        // Verify the board is valid
        if (normalTiles.length < 24) {
            alert('Not enough normal tiles to create a board (required: 24, current: ' + normalTiles.length + ')'); return;
        }
        if (freeTiles.length < 1) {
            alert('No free tiles (required: 1, current: ' + freeTiles.length + ')'); return;
        }

        // Only keep one free tile
        var freeTile = freeTiles.splice(Math.floor(Math.random() * freeTiles.length), 1);

        // Build board
        var boardBody = $('#gameboard tbody').empty();
        for (var r = 0; r < 5; r++) {
            var tr = $('<tr>').appendTo(boardBody);
            for (var c = 0; c < 5; c++) {
                var val = undefined;
                if (!!freeTile && r == 2 && c == 2) {
                    // At the center, use a free tile
                    val = freeTile[0];
                } else {
                    // Pop out a random element from the available tiles
                    var valIndex = Math.floor(Math.random() * normalTiles.length);
                    val = normalTiles.splice(valIndex, 1)[0];
                }
                var td = $('<td>', { text: val.title, class: 'clickable' }).data('item', val).appendTo(tr);
            }
        }
    },
    doClear: function () {
        if (confirm("Clear Board will uncheck all checked board tiles. Do you want to continue?")) {
            $('#gameboard td').removeClass('checked')
        }
    },
    doWinCheck: function () {
        var start = (Date.now());

        var IS_LOGGING = false;
        var log = function () {
            if (!IS_LOGGING) return;
            console.log.apply(console, arguments);
        }

        var isChecked = function (el) { return $(el).is('.checked') }
        var getAbsPos = function (pos, dirX, dirY) { return pos + dirX + (dirY * boardSize) }

        var dataLinear = $('#gameboard td').map((i, el) => isChecked(el) ? true : false);
        var boardSize = Math.sqrt(dataLinear.length);

        var dataBox = []
        Array(boardSize).fill(0).map((el, y) => {
            dataBox.push(Array(boardSize).fill(0).map((el, x) => dataLinear[getAbsPos(0, x, y)]))
        });
        log('dataBox', dataBox);

        /** Checks a single cell for bingo */
        var isCellBingo = function (dataBox, posX, posY, runX, runY, checkedCount, codeBranch) {
            var isBingoData = {
                pos: posX + "," + posY,
                run: runX + "," + runY,
                checkedCount: checkedCount,
                codeBranch: codeBranch,
            }
            log("isBingo", isBingoData);

            var absX = posX + runX;
            var absY = posY + runY;

            var isOutOfBounds = function (x, y) {
                return (x < 0 || x >= boardSize || y < 0 || y >= boardSize);
            }
            var getCellValue = function (x, y, rX, rY) {
                var newAbsX = x + rX;
                var newAbsY = y + rY;
                if (isOutOfBounds(newAbsX, newAbsY)) return false;
                return dataBox[newAbsX][newAbsY];
            }

            // Bingo!
            if (checkedCount == boardSize) return true;

            // Out of bounds
            if (isOutOfBounds(dataBox, absX, absY)) return false;

            // Cell is not checked
            var cellVal = dataBox[absX][absY];
            if (cellVal !== true) return false;
            
            // Cell is checked
            else {
                // No run started, start run in all 8 surrounding directions
                if (checkedCount == 0) {
                    for (var y = -1; y <= 1; y++) {
                        for (var x = -1; x <= 1; x++) {
                            if (x == 0 && y == 0) continue;
                            var isCellBingoVal = isCellBingo(dataBox, posX, posY, x, y, 2, 'run start ' + [x, y]);
                            if (isCellBingoVal) return true;
                        }
                    }
                }

                // Run already started, continue singlular direction
                else {
                    var newRunX = runX + (runX == 0 ? 0 : runX > 0 ? 1 : -1);
                    var newRunY = runY + (runY == 0 ? 0 : runY > 0 ? 1 : -1);
                    var newCellVal = getCellValue(posX, posY, newRunX, newRunY);
                    if (newCellVal === true) {
                        return isCellBingo(dataBox, posX, posY, newRunX, newRunY, (checkedCount + 1), 'run continue ' + [newRunX, newRunY]);
                    }
                    isBingoData.codeBranch = 'run end ' + [newRunX, newRunY];
                    log("isBingo", isBingoData);
                    return false
                }
            }
        }

        /** Walks the board, checking every cell for bingo */
        function isBoardBingo() {
            for (var y = 0; y < boardSize; y++) {
                for (var x = 0; x < boardSize; x++) {
                    if (isCellBingo(dataBox, x, y, 0, 0, 0, 'walk board')) return true;
                }
            }
            return false;
        }

        // Check the board for a winning condition
        isWin = isBoardBingo();
        if (isWin) {
            GGB.gameboard.doWin(true);
        }

        log('time to complete ' + (Date.now() - start));
        return isWin;
    },
    doWin: function (isShow) {
        $('#win-wrapper').toggleClass('hidden', !isShow);
    }
};

GGB.configTiles = {
    init: function () {
        // Attach action handlers
        $('#btn-config-back').on('click', function () {
            GGB.gameboard.doShow();
        });
        $('#btn-config-add').on('click', function () {
            GGB.configTiles.doAdd();
        });
        $('#config-area').on('change', '[name=free]', function () {
            GGB.configTiles.doToggleFree($(this).closest('tr').data('item'));
        });
        $('#config-area').on('change', '[name=name], [name=title]', function () {
            GGB.configTiles.doSaveAll();
            GGB.configTiles.doRefresh();
        });
        $('#config-tiles').on('click', '.remove', function () {
            GGB.configTiles.doDelete($(this).closest('tr').data('item'));
        });

        // Load custom board
        GGB.configTiles.doLoadUrl();
    },
    doShow: function () {
        GGB.configTiles.doRefresh();
        GGB.page.doShowContentBody('#config-wrapper');
    },
    doRefresh: function () {
        var boardData = GGB.gameboard.data;

        // Build name
        $('#config-area').find('[name=name]').val(boardData.name);
        $('#config-name').text(boardData.name);

        // Always include a new tile as the last entry
        if (boardData.tiles.length == 0 || !!boardData.tiles[boardData.tiles.length - 1].title) {
            boardData.tiles.push($.extend(GGB.gameboard.getDefaultTile(), { title: '' }));
        }

        // Build tiles
        var tbl = $('#config-tiles');
        var tblBody = tbl.find('tbody');
        var tblTemplate = $('#config-tiles-template');
        tblBody.find('tr').remove();
        $(boardData.tiles).each(function (i, el) {
            var freeId = 'free-' + i;
            var tr = tblTemplate.find('tr.template').clone().removeClass('template').data('item', el);
            tr.find('[name=title]').val(el.title).data('index', i);
            tr.find('[name=free]').attr('id', freeId).prop('checked', !!el.free).data('index', i);
            tr.find('label').attr('for', freeId);
            tr.appendTo(tblBody);
        });
    },

    doDelete: function (entry) {
        var boardData = GGB.gameboard.data;
        boardData.tiles = boardData.tiles.filter(el => el.title != entry.title);
        GGB.savedBoards.doSave(boardData);
        GGB.configTiles.doRefresh();
    },
    doToggleFree: function (entry) {
        entry.free = !entry.free;
        GGB.savedBoards.doSave(GGB.gameboard.data);
    },
    doAdd: function () {
        GGB.gameboard.data.tiles.push({});
        GGB.configTiles.doRefresh();
    },
    doSaveAll: function () {
        var boardData = GGB.gameboard.data;

        // Save name
        boardData.name = $('[name=name]').val();

        // Save tiles
        var tbl = $('#config-tiles');
        var dataEls = tbl.find(':input');
        var tileValuesNew = [];
        $(dataEls).each(function (i, el) {
            var o = $(el);
            var val = (o.is(':checkbox') ? o.prop('checked') : o.val());
            var tileValue = tileValuesNew[o.data('index')] = (tileValuesNew[o.data('index')] || {});
            tileValue[o.attr('name')] = val;
        });
        //console.log(dataEls, tileValuesNew, GGB.tilesValues);
        boardData.tiles = tileValuesNew;
        GGB.savedBoards.doSave(boardData);
    },
    doShare: function () {
        // Generate share info
        var customTitle = 'Game Grumps Bingo Custom Board';
        var params = new URLSearchParams(window.location.search);
        params.set('customboard', GGB.configTiles.doExport());
        var shareUrl = window.location.href.split('?')[0] + '?' + params.toString();

        // Share (mobile or desktop)
        if (navigator.share) {
            navigator.share({
                title: customTitle,
                url: shareUrl
            });
        } else {
            var share = $('#share-wrapper');
            share.find('#lnkShare').attr('href', shareUrl).text(customTitle);
            GGB.page.doShowContentBody('#share-wrapper');
        }
    },
    doExport: function () {
        // Convert data to base64
        return btoa(JSON.stringify(GGB.gameboard.data));
    },
    doLoadUrl: function () {
        // Convert data from base64 in query string
        // TODO: Save historical list of loaded boards (separate from saved boards, but give option to save)
        var params = new URLSearchParams(window.location.search);
        var customboard64 = params.get('customboard');
        if (!!customboard64) {
            try {
                var data = JSON.parse(atob(customboard64));
                GGB.gameboard.doLoad(data);
            } catch (e) {
                console.error(e);
                alert('Failed to load custom board');
            }
        }
    }
};

GGB.savedBoards = {
    // { name: 'Default', saved: false, default: false, tiles: {} }
    data: [],

    init: function () {
        // Events
        $('#saved-boards-area').on('click', '.remove', function () {
            if (confirm("Are you sure you want to delete this gameboard?")) {
                var entry = $(this).closest('tr').data('item');
                GGB.savedBoards.data = GGB.savedBoards.data.filter(el => el.name != entry.name);
                GGB.savedBoards.doRefresh();
                GGB.savedBoards.doSaveLocal();
            }
        });
        $('#saved-boards-area').on('change', '[name=lock]', function () {
            var entry = $(this).closest('tr').data('item');
            entry.locked = !entry.locked;
            GGB.savedBoards.doSaveLocal();
        });
        $('#saved-boards-area').on('change', '[name=default]', function () {
            var entry = $(this).closest('tr').data('item');
            entry.default = $(this).prop('checked');
            GGB.savedBoards.doSaveLocal();
        });
        $('#saved-boards-area').on('click', '.load', function () {
            var entry = $(this).closest('tr').data('item');
            GGB.gameboard.doLoad(entry);
            GGB.gameboard.doShow();
        });
        $('#saved-boards-area').on('change', '[name=name]', function () {
            var entry = $(this).closest('tr').data('item');
            entry.name = $(this).val();
            GGB.savedBoards.doRefresh();
            GGB.savedBoards.doSaveLocal();
        });
        $('#saved-boards-area').on('click', '#btn-back', function () {
            GGB.gameboard.doShow();
        });

        // Load saved boards
        GGB.savedBoards.doLoadLocal();

        // Set default board
        GGB.savedBoards.data.filter(el => !!el.default).forEach(el => GGB.gameboard.data = el);

        // Refresh list
        GGB.savedBoards.doRefresh();
    },
    doShow: function () {
        GGB.savedBoards.doRefresh();
        GGB.page.doShowContentBody('#saved-boards-wrapper');
    },
    doRefresh: function () {
        var savedBoards = GGB.savedBoards.data;

        // Always include a new tile as the last entry
        if (!!savedBoards[savedBoards.length - 1].name) {
            savedBoards.push($.extend(GGB.gameboard.getDefaultBoard(), { name: '' }));
        }

        // Build tiles
        var tbl = $('#saved-boards');
        var tblBody = tbl.find('tbody');
        var tblTemplate = $('#saved-boards-template');
        tblBody.find('tr').remove();
        $(savedBoards).each(function (i, el) {
            var lockId = 'lock-' + i;
            var defaultId = 'default-' + i;
            var tr = tblTemplate.find('tr.template').clone().removeClass('template').data('item', el);
            tr.find('[name=name]').val(el.name);
            tr.find('[name=lock]').attr('id', lockId).prop('checked', !!el.locked).data('index', i);
            tr.find('[name=default]').attr('id', defaultId).prop('checked', !!el.default).data('index', i);
            tr.find('label').attr('for', lockId);
            tr.appendTo(tblBody);
        });
    },
    doSave: function (data) {
        // Add or update a saved gameboard
        var index = -1;
        GGB.savedBoards.data.forEach((el, i) => {
            if (el.name == data.name) {
                index = i;
                return;
            }
        });
        if (index > -1) {
            GGB.savedBoards.data[index] = data;
        } else {
            GGB.savedBoards.data.push(data);
        }

        // Update local storage
        GGB.savedBoards.doSaveLocal();
    },
    doSaveLocal: function () {
        // Save gameboards in local storage
        var dataStr = btoa(JSON.stringify(GGB.savedBoards.data))
        localStorage.savedBoards = dataStr;
    },
    doLoadLocal: function () {
        // Load saved gameboards from local storage
        var dataStr = (localStorage.savedBoards ? atob(localStorage.savedBoards) : undefined)
        var dataObj = (dataStr ? JSON.parse(dataStr) : undefined);
        GGB.savedBoards.data = (dataObj ? dataObj : [GGB.gameboard.getDefaultBoard()]);
    }
};

GGB.savedBoards.init();
GGB.configTiles.init();
GGB.gameboard.init();
GGB.page.init();