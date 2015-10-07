var Writer = function(anim) {
	this.animation = anim || new Animation();
}

Writer.prototype.addAnimation = function(anim) {
	for (frame in anim.frames) {
		this.addFrame(frame);
	}
}

Writer.prototype.addFrame = function(frame) {
	this.animation.addFrame(frame);
}

var ArrayWriter = function() {
	this.bytes = [];
}

ArrayWriter.prototype.writeByte = function(value) {
	this.bytes.push(value);
};

ArrayWriter.prototype.writeShort = function(value) {
	this.writeByte((value >> 8) & 0xFF);
	this.writeByte((value >> 0) & 0xFF);
};

ArrayWriter.prototype.writeSignedShort = function(value) {
	if (value < 0)
		value = 65535 + value;
	this.writeByte((value >> 8) & 0xFF);
	this.writeByte((value >> 0) & 0xFF);
};

ArrayWriter.prototype.writeLong = function(value) {
	this.writeByte((value >> 24) & 0xFF);
	this.writeByte((value >> 16) & 0xFF);
	this.writeByte((value >> 8) & 0xFF);
	this.writeByte((value >> 0) & 0xFF);
};

ArrayWriter.prototype.writeString = function(string, len) {
	for (var i=0; i<len; i++) {
		if (i < string.length)
			this.writeByte(string.charCodeAt(i));
		else
			this.writeByte(0);
	}
}

Writer.toByteArray = function(file, callback) {
	var p = new ArrayWriter();
	for(var si in file.sections) {
		var section = file.sections[si];
		Writer.readFrame(section, section.type, p);
	}
	callback(p.bytes);
}

Writer.toByteArrayWithFormat = function(file, callback, format)
{
	var p = new ArrayWriter();
	for(var si in file.sections) {
		var section = file.sections[si];
		Writer.readFrame(section, format, p);
	}
	callback(p.bytes);
}

Writer.readFrame = function(section, format, p) {

		switch(format) {
			//Frame:
			case 0:	//3D, palette
			case 1: //2D, palette
			case 4: //3D, RGB
			case 5: //2D, RGB
				p.writeString('ILDA', 4);
				p.writeLong(format);
				p.writeString(section.name, 8);
				p.writeString(section.company, 8);
				p.writeShort(section.points.length);
				p.writeShort(section.index);
				p.writeShort(section.total);
				p.writeByte(section.head);
				p.writeByte(0);
				for(var i=0; i<section.points.length; i++) {
					var point = section.points[i];
					p.writeSignedShort(point.x);
					p.writeSignedShort(point.y);
					if(format == 0 || format == 4) p.writeSignedShort(point.z);
					if(format == 0 || format == 1) p.writeByte(point.color & 0xFF);
					var st = 0;
					if (point.blanking)
						st |= 0x40;
					if (point.last || i == section.points.length-1)
						st |= 0x80;
					p.writeByte(st);
					if(format == 4 || format == 5)
					{
						var color = section.colors[i];
						p.writeByte(color.b);
						p.writeByte(color.g);
						p.writeByte(color.r);
					}
				}
				break;
			
			case SectionTypes.COLOR_TABLE:
				// color palette
				p.writeString('ILDA', 4);
				p.writeLong(section.type);
				p.writeString(section.name, 8);
				p.writeString(section.company, 8);
				p.writeShort(section.colors.length);
				p.writeShort(section.index);
				p.writeByte(0);
				p.writeByte(0);
				p.writeByte(section.head);
				p.writeByte(0);
				for(var i=0; i<section.colors.length; i++) {
					var color = section.colors[i];
					p.writeByte(color.r);
					p.writeByte(color.g);
					p.writeByte(color.b);
				}
 				break;
			case SectionTypes.TRUECOLOR_TABLE:
				// truecolor
				p.writeString('ILDA', 4);
				p.writeLong(section.type);
				p.writeLong(section.colors.length * 3 + 4);
				p.writeLong(section.colors.length);
				for(var i=0; i<section.colors.length; i++) {
					var color = section.colors[i];
					p.writeByte(color.r);
					p.writeByte(color.g);
					p.writeByte(color.b);
				}
				break;
		}
	
	
}

ILDA.Writer = Writer;
