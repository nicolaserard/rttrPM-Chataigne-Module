/*
 ==============================================================================

  Chataigne Module for FreeD protocol

  Copyright: Nicolas Erard, March 2024

  ==============================================================================
===============================================================================
This file is a Chataigne Custom Module to input FreeD protocol into the software.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.
3. The name of the author may not be used to endorse or promote products
derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
===============================================================================
*/

var Objects = [];
function init() {


    OrientationX = local.values.addFloatParameter("Orientation X", "Orientation X", 0.0, -180.0, 180.0);
    OrientationY = local.values.addFloatParameter("Orientation Y", "Orientation Y", 0.0, -180.0, 180.0);
    OrientationZ = local.values.addFloatParameter("Orientation Z", "Orientation Z", 0.0, -180.0, 180.0);
    OrientationW = local.values.addFloatParameter("Orientation W", "Orientation W", 0.0, -180.0, 180.0);


    orientation_r1 = local.values.addFloatParameter("Orientation r1", "Orientation r1", 0.0, -180.0, 180.0);
    orientation_r2 = local.values.addFloatParameter("Orientation r2", "Orientation r2", 0.0, -180.0, 180.0);
    orientation_r3 = local.values.addFloatParameter("Orientation r3", "Orientation r3", 0.0, -180.0, 180.0);
    orientation_order = local.values.addIntParameter("Orientation order", "Orientation order", 0, 0, 100000);

    for (var i = 1; i <= 32; i++)
    {

        create_object(i);
    }
}

function create_object(index)
{
    Objects.push({
        "index": index
    });
    var i = index - 1;
    obj = local.values.addContainer("Object " + index);

    Objects[i].position = obj.addPoint3DParameter("Position", "Position", [0.0, 0.0, 0.0]);
    Objects[i].velocity = obj.addPoint3DParameter("Velocity", "Velocity", [0.0, 0.0, 0.0]);
    Objects[i].acceleration = obj.addPoint3DParameter("Acceleration", "Acceleration", [0.0, 0.0, 0.0]);
    obj.setCollapsed(true);

}


function dataReceived(data) {
    // HEADER
    var header_integer_signature = (data[0] << 8) | data[1];
    var b_int_as_big_endian = header_integer_signature == util.hexStringToInt("4154");
    var header_float_signature = (data[2] << 8) | data[3];
    var b_float_as_big_endian = header_float_signature == util.hexStringToInt("4334");

    var header_version = b_int_as_big_endian ? (data[4] << 8) | data[5]                                     : (data[5] << 8) | data[4];
    var pID = b_int_as_big_endian ? (data[6] << 24) | (data[7] << 16) | (data[8] << 8) | data[9]            : (data[9] << 24) | (data[8] << 16) | (data[7] << 8) | data[6];
    var packet_format = data[10];
    var packet_size = b_int_as_big_endian ? (data[11] << 8) | data[12]                                      : (data[12] << 8) | data[11];
    var context = b_int_as_big_endian ? (data[13] << 24) | (data[14] << 16) | (data[15] << 8) | data[16]    :(data[16] << 24) | (data[15] << 16) | (data[14] << 8) | data[13] ;

    var number_of_modules = data[17];

    var offset_i = 18;
    for (var i = 0; i < number_of_modules; i++) {

        data = data.splice(offset_i);
        offset_i = extract_packet(data, b_int_as_big_endian, b_float_as_big_endian);
    }
}

function extract_packet(data, b_int_as_big_endian, b_float_as_big_endian)
{
    var packet_type = data[0];
    var packet_size = b_int_as_big_endian ? ((data[1] << 8) | data[2]) : (data[1] | (data[2] << 8));
    var name_length = data[3];

    var name  = '';
    for (var n=0; n < name_length; n++)
    {
        name += String.fromCharCode(data[4+n]);
    }
    // script.log("packet_type: " + packet_type + ", packet_size: " + packet_size + ", name_lenght: " + name_length + ", name: " + name);

    if (packet_type == 1)
    {
        var number_submodules = data[name_length + 4];
        var offset_j = name_length + 4;
    }
    else if (packet_type == 81)
    {
        var time_stamp = b_int_as_big_endian ? (data[name_length + 4] << 24 | data[name_length + 5] << 16 | data[name_length + 6] << 8 | data[name_length + 7]) : (data[name_length + 7] << 24 | data[name_length + 6] << 16 | data[name_length + 5] << 8 | data[name_length + 4]);
        var number_submodules = data[name_length + 8];
        var offset_j = name_length + 8;
    }

   for (var j = 0; j < number_submodules; j++)
    {
        // script.log("Module type: " + data[offset_j + 1]);

        if (data[offset_j + 1] == 2)
        {
            //centroid mod
            var module_size = b_int_as_big_endian ? ((data[offset_j + 2] << 8) | data[offset_j + 3]) : ((data[offset_j + 3] << 8) | data[offset_j + 2]);
            var latency = b_int_as_big_endian ? ((data[offset_j + 4] << 8) | data[offset_j + 5]) : ((data[offset_j + 3] << 8) | data[offset_j + 4]);

            if (!b_float_as_big_endian)
            {
                var x = util.getDoubleFromBytes(data[offset_j + 13], data[offset_j + 12], data[offset_j + 11], data[offset_j + 10], data[offset_j + 9], data[offset_j + 8], data[offset_j + 7], data[offset_j + 6]);
                var z = util.getDoubleFromBytes(data[offset_j + 21], data[offset_j + 20], data[offset_j + 19], data[offset_j + 18], data[offset_j + 17], data[offset_j + 16], data[offset_j + 15], data[offset_j + 14]);
                var y = util.getDoubleFromBytes(data[offset_j + 29], data[offset_j + 28], data[offset_j + 27], data[offset_j + 26], data[offset_j + 25], data[offset_j + 24], data[offset_j + 23], data[offset_j + 22]);
            }
            else
            {
                var x = util.getDoubleFromBytes(data[offset_j + 6], data[offset_j + 7], data[offset_j + 8], data[offset_j + 9], data[offset_j + 10], data[offset_j + 11], data[offset_j + 12], data[offset_j + 13]);
                var z = util.getDoubleFromBytes(data[offset_j + 14], data[offset_j + 15], data[offset_j + 16], data[offset_j + 17], data[offset_j + 18], data[offset_j + 19], data[offset_j + 20], data[offset_j + 21]);
                var y = util.getDoubleFromBytes(data[offset_j + 22], data[offset_j + 23], data[offset_j + 23], data[offset_j + 25], data[offset_j + 26], data[offset_j + 27], data[offset_j + 28], data[offset_j + 29]);
            }
            var index = data[offset_j + 30];

            if (parseInt(name) - 1 > 0 && parseInt(name) - 1 < Objects.length)
            {
                Objects[parseInt(name) - 1].position.set([x, y, z]);
            }

        }
        else if (data[offset_j + 1] === 0)
        {
            //tracked point position: not tested yet
            var module_size = b_int_as_big_endian ? ((data[offset_j + 2] << 8) | data[offset_j + 3]) : ((data[offset_j + 3] << 8) | data[offset_j + 2]);
            var latency = b_int_as_big_endian ? ((data[offset_j + 4] << 8) | data[offset_j + 5]) : ((data[offset_j + 3] << 8) | data[offset_j + 4]);

            if (!b_float_as_big_endian)
            {
                var x = util.getDoubleFromBytes(data[offset_j + 13], data[offset_j + 12], data[offset_j + 11], data[offset_j + 10], data[offset_j + 9], data[offset_j + 8], data[offset_j + 7], data[offset_j + 6]);
                var z = util.getDoubleFromBytes(data[offset_j + 21], data[offset_j + 20], data[offset_j + 19], data[offset_j + 18], data[offset_j + 17], data[offset_j + 16], data[offset_j + 15], data[offset_j + 14]);
                var y = util.getDoubleFromBytes(data[offset_j + 29], data[offset_j + 28], data[offset_j + 27], data[offset_j + 26], data[offset_j + 25], data[offset_j + 24], data[offset_j + 23], data[offset_j + 22]);
            }
            else
            {
                var x = util.getDoubleFromBytes(data[offset_j + 6], data[offset_j + 7], data[offset_j + 8], data[offset_j + 9], data[offset_j + 10], data[offset_j + 11], data[offset_j + 12], data[offset_j + 13]);
                var z = util.getDoubleFromBytes(data[offset_j + 14], data[offset_j + 15], data[offset_j + 16], data[offset_j + 17], data[offset_j + 18], data[offset_j + 19], data[offset_j + 20], data[offset_j + 21]);
                var y = util.getDoubleFromBytes(data[offset_j + 22], data[offset_j + 23], data[offset_j + 23], data[offset_j + 25], data[offset_j + 26], data[offset_j + 27], data[offset_j + 28], data[offset_j + 29]);
            }
            var index = data[offset_j + 28];
            if (index > 0 && index < Objects.length)
            {
                Objects[index].position.set([x, y, z]);
            }

        }
        else if (data[offset_j + 1] == 3)
        {
            // orientation (quaternion)
            var module_size = b_int_as_big_endian ? ((data[offset_j + 2] << 8) | data[offset_j + 3]) : ((data[offset_j + 3] << 8) | data[offset_j + 2]);
            var latency = b_int_as_big_endian ? ((data[offset_j + 4] << 8) | data[offset_j + 5]) : ((data[offset_j + 3] << 8) | data[offset_j + 4]);

            if (!b_float_as_big_endian)
            {
                var qx = util.getDoubleFromBytes(data[offset_j + 13], data[offset_j + 12], data[offset_j + 11], data[offset_j + 10], data[offset_j + 9], data[offset_j + 8], data[offset_j + 7], data[offset_j + 6]);
                var qz = util.getDoubleFromBytes(data[offset_j + 21], data[offset_j + 20], data[offset_j + 19], data[offset_j + 18], data[offset_j + 17], data[offset_j + 16], data[offset_j + 15], data[offset_j + 14]);
                var qy = util.getDoubleFromBytes(data[offset_j + 29], data[offset_j + 28], data[offset_j + 27], data[offset_j + 26], data[offset_j + 25], data[offset_j + 24], data[offset_j + 23], data[offset_j + 22]);
                var qw = util.getDoubleFromBytes(data[offset_j + 37], data[offset_j + 36], data[offset_j + 35], data[offset_j + 34], data[offset_j + 33], data[offset_j + 32], data[offset_j + 31], data[offset_j + 30]);

            }
            else
            {
                var qx = util.getDoubleFromBytes(data[offset_j + 6], data[offset_j + 7], data[offset_j + 8], data[offset_j + 9], data[offset_j + 10], data[offset_j + 11], data[offset_j + 12], data[offset_j + 13]);
                var qz = util.getDoubleFromBytes(data[offset_j + 14], data[offset_j + 15], data[offset_j + 16], data[offset_j + 17], data[offset_j + 18], data[offset_j + 19], data[offset_j + 20], data[offset_j + 21]);
                var qy = util.getDoubleFromBytes(data[offset_j + 22], data[offset_j + 23], data[offset_j + 23], data[offset_j + 25], data[offset_j + 26], data[offset_j + 27], data[offset_j + 28], data[offset_j + 29]);
                var qw = util.getDoubleFromBytes(data[offset_j + 30], data[offset_j + 31], data[offset_j + 32], data[offset_j + 33], data[offset_j + 34], data[offset_j + 35], data[offset_j + 36], data[offset_j + 37]);
            }

            OrientationX.set(qx);
            OrientationY.set(qy);
            OrientationZ.set(qz);
            OrientationW.set(qw);
        }

        else if (data[offset_j + 1] == 4)
        {
            // orientation (euler)
            var module_size = b_int_as_big_endian ? ((data[offset_j + 2] << 8) | data[offset_j + 3]) : ((data[offset_j + 3] << 8) | data[offset_j + 2]);
            var latency = b_int_as_big_endian ? ((data[offset_j + 4] << 8) | data[offset_j + 5]) : ((data[offset_j + 3] << 5) | data[offset_j + 4]);
            var order = b_int_as_big_endian ? ((data[offset_j + 6] << 8) | data[offset_j + 7]) : ((data[offset_j + 7] << 8) | data[offset_j + 6]);

            if (!b_float_as_big_endian)
            {
                var r1 = util.getDoubleFromBytes(data[offset_j + 15], data[offset_j + 14], data[offset_j + 13], data[offset_j + 12], data[offset_j + 11], data[offset_j + 10], data[offset_j + 9], data[offset_j + 8]);
                var r2 = util.getDoubleFromBytes(data[offset_j + 23], data[offset_j + 22], data[offset_j + 21], data[offset_j + 20], data[offset_j + 19], data[offset_j + 18], data[offset_j + 17], data[offset_j + 16]);
                var r3 = util.getDoubleFromBytes(data[offset_j + 31], data[offset_j + 30], data[offset_j + 29], data[offset_j + 28], data[offset_j + 27], data[offset_j + 26], data[offset_j + 25], data[offset_j + 24]);
            }
            else
            {
                var r1 = util.getDoubleFromBytes(data[offset_j + 8], data[offset_j + 9], data[offset_j + 10], data[offset_j + 11], data[offset_j + 12], data[offset_j + 13], data[offset_j + 14], data[offset_j + 15]);
                var r2 = util.getDoubleFromBytes(data[offset_j + 16], data[offset_j + 17], data[offset_j + 18], data[offset_j + 19], data[offset_j + 20], data[offset_j + 21], data[offset_j + 22], data[offset_j + 23]);
                var r3 = util.getDoubleFromBytes(data[offset_j + 24], data[offset_j + 25], data[offset_j + 26], data[offset_j + 27], data[offset_j + 28], data[offset_j + 29], data[offset_j + 30], data[offset_j + 31]);
            }

            orientation_r1.set(r1);
            orientation_r2.set(r2);
            orientation_r3.set(r3);
            orientation_order.set(order);
        }

        if (data[offset_j + 1] == 31)
        {
            // centroid acceleratation and velocity: not implement yet
            var module_size = b_int_as_big_endian ? ((data[offset_j + 2] << 8) | data[offset_j + 3]) : ((data[offset_j + 3] << 8) | data[offset_j + 2]);

            if (!b_float_as_big_endian)
            {
                var x = util.getDoubleFromBytes(data[offset_j + 11], data[offset_j + 10], data[offset_j + 9], data[offset_j + 8], data[offset_j + 7], data[offset_j + 6], data[offset_j + 5], data[offset_j + 4]);
                var z = util.getDoubleFromBytes(data[offset_j + 19], data[offset_j + 18], data[offset_j + 17], data[offset_j + 16], data[offset_j + 15], data[offset_j + 14], data[offset_j + 13], data[offset_j + 12]);
                var y = util.getDoubleFromBytes(data[offset_j + 27], data[offset_j + 26], data[offset_j + 25], data[offset_j + 24], data[offset_j + 23], data[offset_j + 22], data[offset_j + 21], data[offset_j + 20]);
                var acc_x = util.getFloatFromBytes(data[offset_j + 28], data[offset_j + 29], data[offset_j + 30], data[offset_j + 31]);
                var acc_z = util.getFloatFromBytes(data[offset_j + 32], data[offset_j + 33], data[offset_j + 34], data[offset_j + 35]);
                var acc_y = util.getFloatFromBytes(data[offset_j + 36], data[offset_j + 37], data[offset_j + 38], data[offset_j + 39]);
                var velocity_x = util.getFloatFromBytes(data[offset_j + 40], data[offset_j + 41], data[offset_j + 42], data[offset_j + 43]);
                var velocity_y = util.getFloatFromBytes(data[offset_j + 44], data[offset_j + 45], data[offset_j + 46], data[offset_j + 47]);
                var velocity_z = util.getFloatFromBytes(data[offset_j + 48], data[offset_j + 49], data[offset_j + 50], data[offset_j + 51]);
            }
            else
            {
                var x = util.getDoubleFromBytes(data[offset_j + 4], data[offset_j + 5], data[offset_j + 6], data[offset_j + 7], data[offset_j + 8], data[offset_j + 9], data[offset_j + 10], data[offset_j + 11]);
                var z = util.getDoubleFromBytes(data[offset_j + 12], data[offset_j + 13], data[offset_j + 14], data[offset_j + 15], data[offset_j + 16], data[offset_j + 17], data[offset_j + 18], data[offset_j + 19]);
                var y = util.getDoubleFromBytes(data[offset_j + 20], data[offset_j + 21], data[offset_j + 22], data[offset_j + 23], data[offset_j + 24], data[offset_j + 25], data[offset_j + 26], data[offset_j + 27]);
                var acc_x = util.getFloatFromBytes(data[offset_j + 31], data[offset_j + 30], data[offset_j + 29], data[offset_j + 28]);
                var acc_z = util.getFloatFromBytes(data[offset_j + 35], data[offset_j + 34], data[offset_j + 33], data[offset_j + 32]);
                var acc_y = util.getFloatFromBytes(data[offset_j + 39], data[offset_j + 38], data[offset_j + 37], data[offset_j + 36]);
                var velocity_x = util.getFloatFromBytes(data[offset_j + 43], data[offset_j + 42], data[offset_j + 41], data[offset_j + 40]);
                var velocity_y = util.getFloatFromBytes(data[offset_j + 47], data[offset_j + 46], data[offset_j + 45], data[offset_j + 44]);
                var velocity_z = util.getFloatFromBytes(data[offset_j + 51], data[offset_j + 50], data[offset_j + 49], data[offset_j + 48]);
            }

        }

        if (data[offset_j + 1] == 32)
        {
            // tracked point acceleratation and velocity : working
            var module_size = b_int_as_big_endian ? ((data[offset_j + 2] << 8) | data[offset_j + 3]) : ((data[offset_j + 3] << 8) | data[offset_j + 2]);

            if (b_float_as_big_endian)
            {
                var x = util.getDoubleFromBytes(data[offset_j + 11], data[offset_j + 10], data[offset_j + 9], data[offset_j + 8], data[offset_j + 7], data[offset_j + 6], data[offset_j + 5], data[offset_j + 4]);
                var z = util.getDoubleFromBytes(data[offset_j + 19], data[offset_j + 18], data[offset_j + 17], data[offset_j + 16], data[offset_j + 15], data[offset_j + 14], data[offset_j + 13], data[offset_j + 12]);
                var y = util.getDoubleFromBytes(data[offset_j + 27], data[offset_j + 26], data[offset_j + 25], data[offset_j + 24], data[offset_j + 23], data[offset_j + 22], data[offset_j + 21], data[offset_j + 20]);
                var acc_x = util.getFloatFromBytes(data[offset_j + 28], data[offset_j + 29], data[offset_j + 30], data[offset_j + 31]);
                var acc_z = util.getFloatFromBytes(data[offset_j + 32], data[offset_j + 33], data[offset_j + 34], data[offset_j + 35]);
                var acc_y = util.getFloatFromBytes(data[offset_j + 36], data[offset_j + 37], data[offset_j + 38], data[offset_j + 39]);
                var velocity_x = util.getFloatFromBytes(data[offset_j + 40], data[offset_j + 41], data[offset_j + 42], data[offset_j + 43]);
                var velocity_y = util.getFloatFromBytes(data[offset_j + 44], data[offset_j + 45], data[offset_j + 46], data[offset_j + 47]);
                var velocity_z = util.getFloatFromBytes(data[offset_j + 48], data[offset_j + 49], data[offset_j + 50], data[offset_j + 51]);
            }
            else
            {
                var x = util.getDoubleFromBytes(data[offset_j + 4], data[offset_j + 5], data[offset_j + 6], data[offset_j + 7], data[offset_j + 8], data[offset_j + 9], data[offset_j + 10], data[offset_j + 11]);
                var z = util.getDoubleFromBytes(data[offset_j + 12], data[offset_j + 13], data[offset_j + 14], data[offset_j + 15], data[offset_j + 16], data[offset_j + 17], data[offset_j + 18], data[offset_j + 19]);
                var y = util.getDoubleFromBytes(data[offset_j + 20], data[offset_j + 21], data[offset_j + 22], data[offset_j + 23], data[offset_j + 24], data[offset_j + 25], data[offset_j + 26], data[offset_j + 27]);
                var acc_x = util.getFloatFromBytes(data[offset_j + 31], data[offset_j + 30], data[offset_j + 29], data[offset_j + 28]);
                var acc_z = util.getFloatFromBytes(data[offset_j + 35], data[offset_j + 34], data[offset_j + 33], data[offset_j + 32]);
                var acc_y = util.getFloatFromBytes(data[offset_j + 39], data[offset_j + 38], data[offset_j + 37], data[offset_j + 36]);
                var velocity_x = util.getFloatFromBytes(data[offset_j + 43], data[offset_j + 42], data[offset_j + 41], data[offset_j + 40]);
                var velocity_y = util.getFloatFromBytes(data[offset_j + 47], data[offset_j + 46], data[offset_j + 45], data[offset_j + 44]);
                var velocity_z = util.getFloatFromBytes(data[offset_j + 51], data[offset_j + 50], data[offset_j + 49], data[offset_j + 48]);
            }

            var index = data[offset_j + 52];

            if (parseInt(name) - 1 > 0 && parseInt(name ) - 1 < Objects.length)
            {
                Objects[parseInt(name) - 1].position.set([x, y, z]);
                Objects[parseInt(name) - 1].acceleration.set([acc_x, acc_y, acc_z]);
                Objects[parseInt(name) - 1].velocity.set([velocity_x, velocity_y, velocity_z]);
            }
        }

        // Need to implement: packet module Zone collision detection and zone object

        offset_j += module_size;
    }

   return packet_size
}

function moduleParameterChanged(param) {
}

function moduleValueChanged(value) {
}

// This is the callback function for the "Custom command" command
function customCmd(val) {
}