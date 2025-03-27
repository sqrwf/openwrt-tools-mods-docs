'use strict';
'require view';
'require fs';
'require uci';
'require form';
'require tools.widgets as widgets';

function get_share_users_summary(section_id) {
	var
		types = {
			'users'      : _('Valid'),
			'write_list' : _('Read/write'),
			'read_list'  : _('Read-only')
		},
		summary = '',
		users
	;
	for ( var type in types ) {
		users = uci.get('samba4', section_id, type);
		if ( users ) {
			users = users.split(',');
			summary += '<strong>' + types[type] + '</strong> <small>(';
			summary += users.length + ')</small>: ' + users.slice(0,5).join(', ');
			if ( users.length > 5 ) {
				summary += ' <small>(+' + ( users.length - 5 ) + ' more)</small>';
			}
			summary += '<br>';
		}
	}
	if ( uci.get('samba4', section_id, 'guest_ok') == 'yes' ) {
		if ( uci.get('samba4', section_id, 'guest_only') == 'yes' ) {
			summary = 'Guests only';
		} else {
			summary += 'Guests allowed';
		}
	}
	return '<small>' + summary + '</small>';
}

function get_share_summary(section_id) {
	var summary = '<strong>' + ( uci.get('samba4', section_id, 'name') || _('Unnamed share') ) + '</strong><br>';
	summary += uci.get('samba4', section_id, 'path') + '<br>';
	return summary;
}

function get_share_misc_summary(section_id) {
	var summary = [];
	if ( uci.get('samba4', section_id, 'browseable') == 'no' ) {
		summary.push('not browseable');
	}
	if ( uci.get('samba4', section_id, 'read_only') == 'yes' ) {
		summary.push('read only');
	}
	if ( uci.get('samba4', section_id, 'timemachine') ) {
		var timemachine_maxsize = uci.get('samba4', section_id, 'timemachine_maxsize');
		if ( timemachine_maxsize ) {
			summary.push('Time Machine (max. ' + timemachine_maxsize + 'GB)');
		} else {
			summary.push('Time Machine');
		}
	}
	return ( summary.length ? '<small>' + summary.join('<br>') + '</small>' : '' );
}

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.stat('/sbin/block'), null),
			L.resolveDefault(fs.stat('/etc/config/fstab'), null),
			L.resolveDefault(fs.stat('/usr/sbin/nmbd'), {}),
			L.resolveDefault(fs.stat('/usr/sbin/samba'), {}),
			L.resolveDefault(fs.stat('/usr/sbin/winbindd'), {}),
			L.resolveDefault(fs.exec('/usr/sbin/smbd', ['-V']), null),
		]);
	},
	render: function(data) {

		var m, s, o;

		/* Tabbed top section */

		var sambaVersion = '';
		if (data[5] && data[5].code === 0) {
			sambaVersion = data[5].stdout.trim();
		}
		m = new form.Map('samba4', _('Network Shares'), 'samba ' + sambaVersion);

		s = m.section(form.TypedSection, 'samba', _('Server Settings'));
		s.anonymous = true;

		s.tab('general',  _('General Settings'));
		s.tab('advanced', _('Advanced Settings'));
		s.tab('template', _('Template'), _('This is the content of the file <code>/etc/samba/smb.conf.template</code> which serves as the basis for the server\'s configuration.'));

		/* General Settings */

		o = s.taboption('general', widgets.NetworkSelect, 'interface', _('Interface'),
			_('If no interfaces are specified the server will listen on the <code>lan</code> interface'));
		o.multiple = true;
		o.cfgvalue = function(section_id) {
			return L.toArray(uci.get('samba4', section_id, 'interface'));
		};
		o.write = function(section_id, formvalue) {
			var cfgvalue = this.cfgvalue(section_id),
				oldNetworks = L.toArray(cfgvalue),
				newNetworks = L.toArray(formvalue);
			oldNetworks.sort();
			newNetworks.sort();
			if (oldNetworks.join(' ') == newNetworks.join(' '))
				return;
			return uci.set('samba4', section_id, 'interface', newNetworks.join(' '));
		};

		o = s.taboption('general', form.Value, 'workgroup', _('Workgroup'));
		o.placeholder = 'WORKGROUP';

		o = s.taboption('general', form.Value, 'description', _('Description'));
		o.placeholder = 'Samba4 on OpenWrt';

		/* Advanced Settings */

		s.taboption('advanced', form.Flag, 'enable_extra_tuning', _('Enable extra Tuning'),
			_('Apply parameters suggested by the community to boost write speeds and enhance WiFi operation - \
			not advised if multiple clients are concurrently writing to the same files'));

		s.taboption('advanced', form.Flag, 'disable_async_io', _('Disable asynchronous I/O'),
			_('May increase speeds on lower-end devices'));

		s.taboption('advanced', form.Flag, 'macos', _('Add macOS compability'),
			_('Enable extensions to improve macOS compability and enable Time Machine options for shares'));

		s.taboption('advanced', form.Flag, 'allow_legacy_protocols', _('Allow legacy (insecure) protocols/authentication'),
			_('Allow legacy SMBv1/Lanman connections (needed for older devices without SMBv2/SMBv3 support)'));

		if (data[2].type === 'file') {
			s.taboption('advanced', form.Flag, 'disable_netbios', _('Disable NetBIOS'))
		}
		if (data[3].type === 'file') {
			s.taboption('advanced', form.Flag, 'disable_ad_dc', _('Disable Active Directory Domain Controller'))
		}
		if (data[4].type === 'file') {
			s.taboption('advanced', form.Flag, 'disable_winbind', _('Disable Winbind'))
		}

		/* Template */

		o = s.taboption('template', form.TextValue, '_tmpl', null, _('Values enclosed by pipe symbols ("|") are placeholders and should not be changed.'));
		o.rows = 20;
		o.cfgvalue = function(section_id) {
			return fs.trimmed('/etc/samba/smb.conf.template');
		};
		o.write = function(section_id, formvalue) {
			return fs.write('/etc/samba/smb.conf.template', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
		};

		/* Shares table */

		s = m.section(form.GridSection, 'sambashare', _('Shares'));
		s.anonymous = true;
		s.addremove = true;
		s.sortable = true;
		s.cloneable = true;
		s.addbtntitle = _('Add Share');
		s.modaltitle = function(section_id) {
			return _('Edit share "') + ( uci.get('samba4', section_id, 'name') || _('Unnamed share') ) + '"';
		};

		s.tab('general', _('Name and Visibility'));
		s.tab('fileops', _('Path and File Permissions'));
		s.tab('users', _('Users'));
		s.tab('advanced', _('Advanced Settings'));

		o = s.option(form.DummyValue, '_name', _('Share'));
		o.modalonly = false;
		o.textvalue = function(section_id) {
			return get_share_summary(section_id);
		};
		o = s.option(form.DummyValue, '_users', _('Users'));
		o.modalonly = false;
		o.textvalue = function(section_id) {
			return get_share_users_summary(section_id);
		};
		o = s.option(form.DummyValue, '_misc', _('Options'));
		o.modalonly = false;
		o.textvalue = function(section_id) {
			return get_share_misc_summary(section_id);
		};

		o = s.taboption('general', form.Value, 'name', _('Share name'));
		o.modalonly = true;

		o = s.taboption('fileops', form.Value, 'path', _('Path'));
		o.modalonly = true;

		o = s.taboption('general', form.Flag, 'browseable', _('Browseable'),
			_('Share is seen in the list of available shares in a net view and in the browse list'));
		o.modalonly = true;
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'yes';

		o = s.taboption('users', form.Flag, 'guest_ok', _('Allow guests'),
			_('No password is required to connect to this share, privileges will be those of the guest account'));
		o.modalonly = true;
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'no'; // smb.conf default is 'no'
		o.rmempty = false;

		o = s.taboption('users', form.Flag, 'guest_only', _('Allow only guests'),
			_('Allow <strong>only</strong> guest connections to this share'));
		o.depends('guest_ok', 'yes');
		o.modalonly = true;
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'no';

		o = s.taboption('users', form.Flag, 'read_only', _('Read-only'),
			_('Users may not create or modify files'));
		o.modalonly = true;
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'no'; // smb.conf default is 'yes'
		o.rmempty = false;

		o = s.taboption('users', form.Value, 'users', _('Valid users'),
			_('Comma-separated list of users with access to this share'));
		o.modalonly = true;
		o.rmempty = true;

		o = s.taboption('users', form.Value, 'write_list', _('Read/write users'),
			_('Comma-separated list of users with <strong>read/write</strong> access (even for a read-only share)'));
		o.modalonly = true;
		o.rmempty = true;

		o = s.taboption('users', form.Value, 'read_list', _('Read-only users'),
			_('Comma-separated list of users with <strong>read-only</strong> access (even for a read/write share)'));
		o.modalonly = true;
		o.rmempty = true;

		o = s.taboption('fileops', form.Flag, 'force_root', _('Force root'),
			_('All file operations will be performed as root (clients still have to connect as a valid user)'));
		o.modalonly = true;

		o = s.taboption('fileops', form.Flag, 'inherit_owner', _('Inherit owner'),
			_('Ownership for new files and directories is controlled by the ownership of the parent directory'));
		o.modalonly = true;
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'no';

		// Note: I vehemently disagree with Samba-on-OpenWrt's "default" permissions of 0666 (files)/0777 (directories).
		//       They are overly permissive and only suitable to prevent questions from users without proper understanding of user/group permissions.
		//       A suitable default is 0660/0770 which can be eased into 0664/0775.

		o = s.taboption('fileops', form.Value, 'create_mask', _('File create mask'),
			_('UNIX permissions mask for newly created files'));
		o.modalonly = true;
		o.maxlength = 4;
		o.default = '0660';
		o.rmempty = false;

		o = s.taboption('fileops', form.Value, 'dir_mask', _('Directory create mask'),
			_('UNIX permissions mask for newly created directories'));
		o.modalonly = true;
		o.maxlength = 4;
		o.default = '0770';
		o.rmempty = false;

		o = s.taboption('advanced', form.Value, 'vfs_objects', _('VFS objects'),
			_('Backend names which are used for Samba VFS I/O operations (space separated)'));
		o.modalonly = true;
		o.rmempty = true;

		o = s.taboption('advanced', form.Flag, 'timemachine', _('Apple Time Machine share'));
		o.modalonly = true;

		o = s.taboption('advanced', form.Value, 'timemachine_maxsize', _('Maximum Time Machine share size in GB'));
		o.modalonly = true;
		o.depends('timemachine', '1');
		o.rmempty = true;
		o.datatype = 'uinteger';

		return m.render();

	}
});
