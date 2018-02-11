
RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	console.log('SZ Message 2', message);
	if (message.editedAt) {
		return message;
	}

		// only send if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}
    console.log('SZ Message', message);
    console.log('SZ Room', room);
	// if the message has a token, it was sent from the visitor, so ignore it
	if (!message.token) {
		return message;
	}

	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return message;
	}


	const postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);
	// checking if Room is served by or inquiry
	if (room.servedBy) {
    	postData.type = 'LivechatOnlineMessage';

	} else {
		postData.type = 'LivechatOnlineMessageInquiry';
		const inquiry = RocketChat.models.LivechatInquiry.findOne({ rid: room._id });
		postData.agents = [];
		inquiry.agents.forEach((agentID) => {
			const user = RocketChat.models.Users.findOne({_id: agentID});
			const agent = {};
			agent.name = user.name;
			agent.username = user.username;
			agent.emails = user.emails;
			postData.agents.push(agent);
			//console.log('Steven3', agent);
		});
		const departmentID = inquiry.department;
		if (departmentID) {
			const department = RocketChat.models.LivechatDepartment.findOne({_id: departmentID});
			postData.department = department;
		}
	}

    postData.newRoom = message.newRoom;
	postData.messages = [];
	RocketChat.models.Messages.findVisibleByRoomId(room._id, { sort: { ts: 1 } }).forEach((message) => {
		if (message.t) {
			return;
			}
		const msg = {
			username: message.u.username,
			msg: message.msg,
			ts: message.ts
		};

		if (message.u.username !== postData.visitor.username) {
			msg.agentId = message.u._id;
		}
		postData.messages.push(msg);
	});


console.log('Steven2', postData);



	RocketChat.Livechat.sendRequest(postData);

}, RocketChat.callbacks.priority.LOW, 'onlineMessage');
