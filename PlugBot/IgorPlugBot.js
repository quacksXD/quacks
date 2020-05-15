var IPB = {
	misc: {
		commands: "Bot Commands: https://github.com/9Igorce/IgorPlugBot/blob/master/README.md",
		regras: "",
		versao: "V1.3.8",
		facebook: null,
		duel: [],
		duelReady: true,
		motd: [""],
		songURL : null,
		songInfo : null,
		lotWinner: null,
		launchTime: Date.now()
	},
	settings: {
		usersMute: [],
		duelDelay: 30,
		songCounter: 0,
		apocalyse: false,
		admins: [3455675, 20574971],
		apoc: ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","r","s","t","u","v","w","x","y","z","1","2","3","4","5","6","7","8","9","0"],		
		lottery: true,
		globCounter: 0,
		lotWinner: null,
		lotWinners: [],
		lot: 0,
	},
	timeouts: {		
		lotSelect: undefined
	},
	intervals: {
		globCounter: undefined
	},
	userData: {},
	tools: {
		chat : function(data){
			var split = data.message.split(' '),
				cmd = split[0].substring(1).toLowerCase();
			
			if (split[0].indexOf('!')!=0)
				return;
			   
			if (IPB.commands.hasOwnProperty(cmd)){
				IPB.commands[cmd](data,split);
			}
			if(IPB.settings.usersMute.indexOf(data.un) > -1) API.moderateDeleteChat(data.chatid);

			for(var i = 0; i < IPB.settings.apoc.length; i++){
				if(data.message.indexOf(IPB.settings.apoc[i].toLowerCase()) > -1 && IPB.settings.apocalypse){
					API.moderateDeleteChat(data.cid);
				}
			}
		},
		adv: function(data){
			if (!data || !data.songInfo || data.startTime > 0)	return;
			
			var dj = API.getDJ().username;
			var songTime = API.getTimeRemaining();
			$('#woot').click();
			
			data.user=API.getDJ();
			
			if (IPB.settings.checkMedia){
				if (data.songInfo.type=='youtube'){
					$.get('https://www.googleapis.com/youtube/v3/videos?id='+data.songInfo.fkid+'&part=snippet,contentDetails,statistics,status&key=AIzaSyDg9pSV0Tkbq8fo7I1z_gz4oVN0IZ3TeHw',
					function(res){IPB.tools.ytCheck(res,data);})
					.error(function(err){
						IPB.tools.ytCheck(undefined,data);
					});
				}else{
					var req = SC.get('/tracks', {ids: data.songInfo.fkid});
					req.request.onload=function(){IPB.tools.scCheck(req._result,data);};
				}
			}
		},
		scCheck : function(data,obj){
			IPB.misc.songInfo=null;
			if (!data || !obj || !obj.user)
				return API.sendChat('[Erro] Falha ao obter informações sobre a música.');
			
			if (!data.length){
				API.sendChat('[@'+obj.un+'] música indisponível, você será pulado e movido para primeiro na lista de espera!');
				return API.moderateSkip(function(){API.moderateMoveDJ(obj.uid,1);});
			}
			
			for (var i in data){
				var song = data[i];

				var title = song.title,
					genre = song.genre,
					fc = IPB.tools.formatNumber(song.favoritings_count),
					pc = IPB.tools.formatNumber(song.playback_count),
					username = song.username,
					dc = IPB.tools.formatNumber(song.download_count);
				
				IPB.misc.songURL = song.permalink_url;
				
				IPB.misc.songInfo = 'Tocando no momento: '+username+' - '+title+' (reproduções: '+pc+', :star:: '+fc+', gênero: '+genre+', downloads: '+dc+', enviada em: '+song.created_at+')';
				
				if (IPB.settings.showMediaInfo)
					API.sendChat(IPB.misc.songInfo);
				
				break;
			}
		},
		 getUserByName: function(name){
        		for(var i in API.getUsers()) {
            			if (API.getUsers()[i].username === name.trim()) return API.getUsers()[i].id;
        		}
    		},
		globCounter: function() {
			IPB.intervals.globCounter = setInterval(function () {
				IPB.settings.globCounter++;
				if (!(IPB.settings.globCounter % 60) && IPB.settings.lottery && Date.now() - IPB.misc.launchTime >= 1e3 * 60 * 20) IPB.tools.boostLottery();
			}, 6e4)
		},
		boostLottery: function() {
			var e = API.getWaitList();
			e.shift();
			var t = e.length,
			r = e[Math.floor(Math.random() * t)];

			if (r) {
				var user = API.getUser(r.id);
				IPB.settings.lotWinners.push(user.id);
				IPB.settings.lotWinner = user.id;
				IPB.timeouts.lotSelect = setTimeout(IPB.tools.boostLottery, 1e3 * 120);
				API.sendChat("@" + user.un + ' Você ganhou a loteria! Antes de 2 minutos, digite !lottery para ser movido a posição 1. Caso o contrário, será sorteado outro usuário.');
			} else API.sendChat("Infelizmente, ninguem estava possibilitado para ganhar a loteria!( ou alguma coisa ruim aconteceu!) Será sorteado um novo ganhador, então fique ativo no chat!")
		},
		save: function() {
			var t = {
				settings: IPB.settings
			};
			localStorage.setItem("IPBData", JSON.stringify(t));
			console.log('[IPB] Configurações do IPB Salvas.');
		},
		load: function() {
			t = JSON.parse(localStorage.getItem("IPBData"));
			IPB.settings = t.settings;
		},
		loadStorage: function() {
			if(localStorage.getItem("IPBData") !== null){
				IPB.tools.load();
			}else{
				IPB.tools.save();
			}
		},
		formatNumber : function(num) {
			return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
		},
		SecondsToHMS: function(d) {
			d = Number(d);
			var h = Math.floor(d / 3600);
			var m = Math.floor(d % 3600 / 60);
			var s = Math.floor(d % 3600 % 60);
			return ((h > 0 ? (h >= 10 ? h : '0' + h): '00') + ':' + (m > 0 ? (m >= 10 ? m : '0' + m): '00') + ':' + (s > 0 ? (s >= 10 ? s : '0' + s): '00')  );                      
		},
		lockskip: function() {
			var id = API.getDJ().id;
			API.moderateSkip(function(){API.moderateMoveDJ(id, 1);});
		},
		cleanString: function(string) {
			return string.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&#34;/g, "\"").replace(/&#59;/g, ";").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
		},
		kill : function(){
			API.off(API.CHAT, IPB.tools.chat);
			API.off(API.ADVANCE, IPB.tools.adv);
			
			Object.keys(IPB.timeouts).forEach(function(k){
				clearTimeout(IPB.timeouts[k]);
			});
			Object.keys(IPB.intervals).forEach(function(k){
				clearInterval(IPB.intervals[k]);
			});
		}
	},
	commands: {
		ping: function(data, split){
			API.sendChat('[' + data.un + '] Pong!');
		},
		skip: function(data, split){
			if(API.getUser(data.uid).role >= 2 || IPB.settings.admins.indexOf(data.uid) > -1){
				API.sendChat('[' + data.un + '] Usou Skip');
				API.moderateSkip();
			}else{
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
		},
		mute: function(data, split){
			if(API.getUser(data.uid).role >= 2 || IPB.settings.admins.indexOf(data.uid) > -1){
				var name = data.message.substring(7);
				var user1 = API.getUser(data.uid).role || IPB.settings.admin.indexOf(data.uid) > -1;
				var user2 = IPB.tools.getUserByName(name).role || IPB.settings.admin.indexOf(data.uid) > -1;
				if(user1 > user2){
					if(IPB.settings.usersMute.indexOf(name) > -1){
					   API.sendChat('[' + data.un + '] Usuario já está mutado.');
					}else{
					   IPB.settings.usersMute.push(name);
					   API.sendChat('[' + data.un + '] Usuario: @' + name + ' Mutado.');
					}
				} else {
					API.sendChat('@' + data.un + ' Você não pode mutar usuarios com rank maior ou igual ao o seu!');
				}
			}else{
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
		},
		unmute: function(data, split){
			if(API.getUser(data.uid).role >= 2 || IPB.settings.admins.indexOf(data.uid) > -1){
				var name = data.message.substring(9);
				IPB.settings.usersMute.splice(name);
				API.sendChat('[' + data.un + '] Usuario: @' + name + ' Desmutado.');
			}
			if(split[1] == 'all') {
				if(API.getUser(data.uid).role >= 4 || IPB.settings.admins.indexOf(data.uid) > -1){
					IPB.settings.usersMute = [];
				}
			} 
		},
		duel: function(data, split){
			if (IPB.misc.duelReady && IPB.misc.duel[0] === undefined && IPB.tools.getUserByName(data.message.substr(7)) !== data.uid){
					if (IPB.tools.getUserByName(data.message.substr(7))){
						IPB.misc.duel.push(data.uid);
						IPB.misc.duel.push(IPB.tools.getUserByName(data.message.substr(7)).id);
						API.sendChat('@' + data.message.substr(7) + ', ' + data.un + '  Te chamou para o x1! Antes de dois minutos digite !accept para aceitar o x1. AVISO o perdedor ficará mutado por 2 minutos!');
						setTimeout(function(){
							IPB.misc.duel = [];
						}, 120e3);
					} else {
						API.sendChat('[' + data.un + '] Usuário Invalido! Modo de usar: !duel @usuário');
					}
			}
		},
		accept: function(data, split){
			if(data.uid === IPB.misc.duel[1]){
				API.sendChat(API.getUser(IPB.misc.duel[0]).username + ' and ' + API.getUser(IPB.misc.duel[1]).username + ' comeÃ§aram o duel!');
				var win = Math.round(Math.random());
				win === 0 ? lose = 1 : lose = 0;
				var winner = IPB.misc.duel[win];
				var loser = IPB.misc.duel[lose];
				setTimeout(function(){
					API.sendChat(API.getUser(winner).username + ' Ganhou o x1! Isso quer dizer que ' + API.getUser(loser).username + ' vai ficar mutado por 2 minutos!');
					IPB.misc.duelReady = false;
					IPB.settings.usersMute.push(API.getUser(loser).username);
					setTimeout(function(){IPB.settings.usersMute.splice(API.getUser(loser).username);}, 120e3);
					setTimeout(function(){IPB.misc.duelReady = true}, IPB.settings.duelDelay * 1e3);
					IPB.misc.duel = [];
				}, 5000);
			}
		},
		reject: function(data, split) {
			if (data.uid === IPB.misc.duel[1]){
				IPB.misc.duel = [];
				IPB.misc.duelReady = true;
				API.sendChat(data.un + ' Não aceitou o duelo.');
			}
		},
		lockskip: function(data, split) {
			if(API.getUser(data.uid).role >= 2 || IPB.settings.admins.indexOf(data.uid) > -1){
				var id = API.getDJ().id;
				API.sendChat('[' + data.un + '] Usou Lockskip!')
				API.moderateSkip(function(){API.moderateMoveDJ(id, 1);});
			} else {
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
		},
		move: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				var firstSpace = data.message.indexOf(' ');
				var lastSpace = data.message.lastIndexOf(' ');

				var pos;
				var name;

				if (isNaN(parseInt(data.message.substring(lastSpace + 1)))) {
					pos = 1;
					name = data.message.substring(7);
				}else{
					pos = parseInt(data.message.substring(lastSpace + 1));
					name = data.message.substring(7, lastSpace);
				}
				var user = IPB.tools.getUserByName(name);
				if (typeof user === 'boolean') return API.sendChat('[' + data.un + '] Usuário Invalido.');
				if (!isNaN(pos)) {
					API.sendChat('[' + data.un + '] Movendo ' + name + ' para a posição: ' + pos + '.');
					API.moderateMoveDJ(user.id, pos);
				} else return API.sendChat('[' + data.un + '] Posição Invalida!');
			} else {
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
		},
		apocalypse: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				IPB.settings.apocalypse = !IPB.settings.apocalypse;

				if(IPB.settings.apocalypse === true) {
					API.sendChat(data.un + ' Chamou o apocalypse.');
				}
				if(IPB.settings.apocalypse === false) {
					API.sendChat(data.un + ' Deu fim ao apocalypse.')
				}

			} else {
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
			IPB.tools.save();
		},
		startlottery: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				API.sendChat('[' + data.un + '] A loteria vai sortear em 5 minutos! esteja ativo no chat para participar!');
				setTimeout(IPB.tools.boostLottery, 300e3);
			} else {
				API.sendChat('@' + data.un + ' VocÃª não tem permissão para usar este comando!');
			}
		},
		boostlottery: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				IPB.settings.lottery = !IPB.settings.lottery;
				if (IPB.settings.lottery) API.sendChat('[' + data.un + '] Bonus da loteria ativo. A cada hora um usuário ativo tem a chance de ganhar a posição 1 como prêmio na lista de espera!');
				else {
					API.sendChat('[' + data.un + '] Loteria Desativada!');
					clearTimeout(IPB.timeouts.lotSelect)
				}
			} else {
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
			IPB.tools.save();
		},
		lottery: function(data, split) {
			if (IPB.settings.lottery && data.uid == IPB.settings.lotWinner) {
				check = true;
				if (check) {
					IPB.settings.lotWinner = null;
					clearTimeout(IPB.timeouts.lotSelect);
					IPB.settings.lotWinners.length = 0;
					++IPB.settings.lot;
						API.moderateMoveDJ(data.uid, 5);
						API.sendChat('[' + data.un + '] Movendo o ganhador da loteria para a posição 1.');
				}
			}
		},
		lotsync: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				IPB.settings.globCounter = (new Date).getMinutes();
				API.sendChat('[' + data.un + '] Loteria sincronizada com o tempo atual. A Loteria vai ocorrer a cada hora!. (:00)')
			} else {
				API.sendChat('@' + data.un + ' Você não tem permissÃ£o para usar este comando!');
			}
		},
		lotreset: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				IPB.settings.globCounter = 0;
				API.sendChat('[' + data.un + '] Loteria Resetada! a próxima rodada será nos próximos 60 minutos.');
			} else {
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
		},
		kill: function(data, split){
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				API.sendChat('Shutting Down!');
				IPB.tools.save();
				IPB.tools.kill();
			} else {
				API.sendChat('@' + data.un + ' Você não tem permissão para usar este comando!');
			}
		},
		reload: function(data, split) {
			if(API.getUser(data.uid).role >= 3 || IPB.settings.admins.indexOf(data.uid) > -1){
				API.sendChat('Reloading...');
				IPB.tools.save();
				IPB.tools.kill();
				setTimeout(function(){
					$.getScript('');
				}, 5e2);
			} else {
				API.sendChat('@' + data.un + ' You have no permission to execute this command!');
			}
		},
		commands: function(data, split) {
			API.sendChat('[' + data.un + '] ' + IPB.misc.commands);
		},
		eta: function(data, split) {
			var wl = API.getWaitList();
			var wlp = API.getWaitListPosition(data.uid);
			var tempoRes=API.getTimeRemaining();
			if(wlp === -1) {
				return API.sendChat('@' + data.un + ' You are not in queue.');
			}
			for (var i = 0; i < wlp; i++){
				tempoRes+= ~~(wl[i].songLength/1e3);
			}
			API.sendChat("[" + data.un + "]" + " ETA is " + IPB.tools.SecondsToHMS(tempoRes));
		},
	}
};
	
function StartUp(){
	API.sendChat('/em PlugBot ' + IPB.misc.versao + ' Now Running!');

	API.on(API.CHAT, IPB.tools.chat);		
	API.on(API.ADVANCE, IPB.tools.adv);
    IPB.settings.globCounter = (new Date).getMinutes();
    IPB.tools.globCounter();
}

API.moderateDeleteChat = function(cid){
	$.ajax({
		url: 'https://stg.plug.dj/chat/' + cid,
		type: 'DELETE'
	})
}

StartUp();
