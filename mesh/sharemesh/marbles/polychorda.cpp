//http://www.sci.utah.edu/~wald/animrep/24-cell/additional/polychora.cpp
// Polychora: Generate .obj animations of rotating regular convex polychora
//            (four dimensional polytopes) mapped onto the hypersphere and
//            then stereographically projected down to three dimensions.
//
// Author: Andrew Kensler
// Date: October 21, 2007

#include <math.h>
#include <algorithm>
#include <vector>
#include <utility>
#include <iostream>
#include <iomanip>
#include <sstream>
#include <fstream>

using namespace std;

// Tesseract settings
#if 0
static const double projective_offset = 1.5;
static const int edge_u_steps = 16;
static const int edge_v_steps = 32;
static const double edge_radius = 0.025;
static const int vertex_u_steps = 32;
static const int vertex_v_steps = 16;
static const double vertex_radius = 0.05;
static const double scale = 100.0;
static const double xy_rate = 1.0;
static const double xy_phase = 0.0;
static const double xz_rate = 0.0;
static const double xz_phase = 0.06;
static const double xw_rate = 0.0;
static const double xw_phase = 0.07;
static const double yz_rate = 0.0;
static const double yz_phase = 0.08;
static const double yw_rate = 0.0;
static const double yw_phase = 0.0;
static const double zw_rate = 1.0;
static const double zw_phase = 0.125;
static const int frames = 128;
static const int cells = 8;     // 8, 16 or 20 (120 doesn't work yet)
#endif

// 24-cell settings
#if 1
static const double projective_offset = 1.5;
static const int edge_u_steps = 16;
static const int edge_v_steps = 32;
static const double edge_radius = 0.025;
static const int vertex_u_steps = 32;
static const int vertex_v_steps = 16;
static const double vertex_radius = 0.05;
static const double scale = 100.0;
static const double xy_rate = 1.0;
static const double xy_phase = 0.0;
static const double xz_rate = 0.0;
static const double xz_phase = 0.06;
static const double xw_rate = 0.0;
static const double xw_phase = 0.07;
static const double yz_rate = 0.0;
static const double yz_phase = 0.08;
static const double yw_rate = 0.0;
static const double yw_phase = 0.0;
static const double zw_rate = 1.0;
static const double zw_phase = 0.125;
static const int frames = 128;
static const int cells = 24;     // 8, 16 or 24 (120 doesn't work yet)
#endif

struct vector4
{
    double data[ 4 ];
    vector4(
        double x0,
        double x1,
        double x2,
        double x3 )
    {
        data[ 0 ] = x0;
        data[ 1 ] = x1;
        data[ 2 ] = x2;
        data[ 3 ] = x3;
    }
};

bool operator<(
    vector4 const &left,
    vector4 const &right )
{
    return ( left.data[ 0 ] < right.data[ 0 ] ? true :
             left.data[ 0 ] > right.data[ 0 ] ? false :
             left.data[ 1 ] < right.data[ 1 ] ? true :
             left.data[ 1 ] > right.data[ 1 ] ? false :
             left.data[ 2 ] < right.data[ 2 ] ? true :
             left.data[ 2 ] > right.data[ 2 ] ? false :
             left.data[ 3 ] < right.data[ 3 ] );
}

bool operator==(
    vector4 const &left,
    vector4 const &right )
{
    return ( left.data[ 0 ] == right.data[ 0 ] &&
             left.data[ 1 ] == right.data[ 1 ] &&
             left.data[ 2 ] == right.data[ 2 ] &&
             left.data[ 3 ] == right.data[ 3 ] );
}

vector4 const operator+(
    vector4 const &left,
    vector4 const &right )
{
    return vector4( left.data[ 0 ] + right.data[ 0 ],
                    left.data[ 1 ] + right.data[ 1 ],
                    left.data[ 2 ] + right.data[ 2 ],
                    left.data[ 3 ] + right.data[ 3 ] );
}

vector4 const operator-(
    vector4 const &left,
    vector4 const &right )
{
    return vector4( left.data[ 0 ] - right.data[ 0 ],
                    left.data[ 1 ] - right.data[ 1 ],
                    left.data[ 2 ] - right.data[ 2 ],
                    left.data[ 3 ] - right.data[ 3 ] );
}

vector4 const operator*(
    vector4 const &left,
    double const right )
{
    return vector4( left.data[ 0 ] * right,
                    left.data[ 1 ] * right,
                    left.data[ 2 ] * right,
                    left.data[ 3 ] * right );
}

double const operator*(
    vector4 const &left,
    vector4 const &right )
{
    return ( left.data[ 0 ] * right.data[ 0 ] +
             left.data[ 1 ] * right.data[ 1 ] +
             left.data[ 2 ] * right.data[ 2 ] +
             left.data[ 3 ] * right.data[ 3 ] );
}

vector4 const operator%(
    vector4 const &left,
    vector4 const &right )
{
    return vector4( ( left.data[ 1 ] * right.data[ 2 ] -
                      left.data[ 2 ] * right.data[ 1 ] ),
                    ( left.data[ 2 ] * right.data[ 0 ] -
                      left.data[ 0 ] * right.data[ 2 ] ),
                    ( left.data[ 0 ] * right.data[ 1 ] -
                      left.data[ 1 ] * right.data[ 0 ] ),
                    0.0 );
}

double const operator!(
    vector4 const &that )
{
    return sqrtf( that * that );
}

vector4 const operator~(
    vector4 const &that )
{
    return that * ( 1.0 / !that );
}

vector4 const lerp(
    vector4 const &start,
    vector4 const &stop,
    double position )
{
    return start * ( 1.0 - position ) + stop * position;
}

bool is_odd(
    vector4 vertex )
{
    bool odd = false;
    for ( int pass = 0; pass < 4; ++pass )
        for ( int component = 0; component < 3; ++component )
            if ( vertex.data[ component ] > vertex.data[ component + 1 ] )
            {
                swap( vertex.data[ component ],
                      vertex.data[ component + 1 ] );
                odd = !odd;
            }
    return odd;
}

void add_permutations(
    vector< vector4 > &object,
    vector4 vertex )
{
    sort( vertex.data, vertex.data + 4 );
    do
    {
        object.push_back( vertex );
    } while ( next_permutation( vertex.data, vertex.data + 4 ) );
}

void add_even_permutations(
    vector< vector4 > &object,
    vector4 vertex )
{
    bool odd = is_odd( vertex );
    sort( vertex.data, vertex.data + 4 );
    do
    {
        if ( is_odd( vertex ) + odd != 1 )
            object.push_back( vertex );
    } while ( next_permutation( vertex.data, vertex.data + 4 ) );
}

void add_sign_combinations(
    vector< vector4 > &object,
    vector4 const &vertex )
{
    for ( int sign_0 = -1; sign_0 <= 1; sign_0 += 2 )
        for ( int sign_1 = -1; sign_1 <= 1; sign_1 += 2 )
            for ( int sign_2 = -1; sign_2 <= 1; sign_2 += 2 )
                for ( int sign_3 = -1; sign_3 <= 1; sign_3 += 2 )
                    object.push_back(
                        vector4( vertex.data[ 0 ] * sign_0,
                                 vertex.data[ 1 ] * sign_1,
                                 vertex.data[ 2 ] * sign_2,
                                 vertex.data[ 3 ] * sign_3 ) );
}

void create_tesseract(
    vector< vector4 > &object )
{
    add_sign_combinations( object, vector4( 1.0, 1.0, 1.0, 1.0 ) );
}

void create_16_cell(
    vector< vector4 > &object )
{
    add_permutations( object, vector4( -1.0, 0.0, 0.0, 0.0 ) );
    add_permutations( object, vector4(  1.0, 0.0, 0.0, 0.0 ) );
}

void create_24_cell(
    vector< vector4 > &object )
{
    add_permutations( object, vector4( -1.0, 0.0, 0.0, 0.0 ) );
    add_permutations( object, vector4(  1.0, 0.0, 0.0, 0.0 ) );
    add_sign_combinations( object, vector4( 0.5, 0.5, 0.5, 0.5 ) );
}

// FIXME: This is broken!  Should add exactly 600 vertices to object!
void create_120_cell(
    vector< vector4 > &object )
{
    static const double sqrt_five = 2.23606797749979;
    static const double tau = 1.618033988749895;
    vector< vector4 > with_signs;
    add_sign_combinations( with_signs, vector4( 0.0, 0.0, 2.0, 2.0 ) );
    add_sign_combinations( with_signs, vector4( 1.0, 1.0, 1.0, sqrt_five ) );
    add_sign_combinations( with_signs, vector4( 1.0 / ( tau * tau ), tau, tau, tau ) );
    add_sign_combinations( with_signs, vector4( 1.0 / tau, 1.0 / tau, 1.0 / tau, tau * tau ) );
    sort( with_signs.begin(), with_signs.end() );
    with_signs.erase( unique( with_signs.begin(), with_signs.end() ),
                      with_signs.end() );
    for ( int index = 0; index < with_signs.size(); ++index )
        add_permutations( object, with_signs[ index ] );
    with_signs.clear();
    add_sign_combinations( with_signs, vector4( 0.0, 1.0 / ( tau * tau ), 1.0, tau * tau ) );
    add_sign_combinations( with_signs, vector4( 0.0, 1.0 / tau, tau, sqrt_five ) );
    add_sign_combinations( with_signs, vector4( 1.0 / tau, 1.0, tau, 2.0 ) );
    sort( with_signs.begin(), with_signs.end() );
    with_signs.erase( unique( with_signs.begin(), with_signs.end() ),
                      with_signs.end() );
    for ( int index = 0; index < with_signs.size(); ++index )
        add_even_permutations( object, with_signs[ index ] );
}

void compute_edges(
    vector< pair< int, int > > &edges,
    vector< vector4 > const &vertices )
{
    double edge_length = 1.0e30;
    for ( int index_1 = 0; index_1 < vertices.size() - 1; ++index_1 )
        for ( int index_2 = index_1 + 1; index_2 < vertices.size(); ++index_2 )
        {
            double distance = !( vertices[ index_1 ] - vertices[ index_2 ] );
            edge_length = min( edge_length, distance );
        }
    for ( int index_1 = 0; index_1 < vertices.size() - 1; ++index_1 )
        for ( int index_2 = index_1 + 1; index_2 < vertices.size(); ++index_2 )
        {
            double distance = !( vertices[ index_1 ] - vertices[ index_2 ] );
            if ( distance < ( edge_length + 0.001 ) )
                edges.push_back( make_pair( index_1, index_2 ) );
        }
}

void rotate_vertices(
    vector< vector4 > &vertices,
    double frame )
{
    static const double two_pi = 6.283185307179586;
    double cos_xy = cos( ( frame * xy_rate + xy_phase ) * two_pi );
    double sin_xy = sin( ( frame * xy_rate + xy_phase ) * two_pi );
    double cos_xz = cos( ( frame * xz_rate + xz_phase ) * two_pi );
    double sin_xz = sin( ( frame * xz_rate + xz_phase ) * two_pi );
    double cos_xw = cos( ( frame * xw_rate + xw_phase ) * two_pi );
    double sin_xw = sin( ( frame * xw_rate + xw_phase ) * two_pi );
    double cos_yz = cos( ( frame * yz_rate + yz_phase ) * two_pi );
    double sin_yz = sin( ( frame * yz_rate + yz_phase ) * two_pi );
    double cos_yw = cos( ( frame * yw_rate + yw_phase ) * two_pi );
    double sin_yw = sin( ( frame * yw_rate + yw_phase ) * two_pi );
    double cos_zw = cos( ( frame * zw_rate + zw_phase ) * two_pi );
    double sin_zw = sin( ( frame * zw_rate + zw_phase ) * two_pi );
    for ( int index = 0; index < vertices.size(); ++index )
    {
        double x0 = vertices[ index ].data[ 0 ];
        double y0 = vertices[ index ].data[ 1 ];
        double z0 = vertices[ index ].data[ 2 ];
        double w0 = vertices[ index ].data[ 3 ];
        double x1 = x0 * cos_xy + y0 * sin_xy;
        double y1 = y0 * cos_xy - x0 * sin_xy;
        double x2 = x1 * cos_xz + z0 * sin_xz;
        double z1 = z0 * cos_xz - x1 * sin_xz;
        double x3 = x2 * cos_xw + w0 * sin_xw;
        double w1 = w0 * cos_xw - x2 * sin_xw;
        double y2 = y1 * cos_yz + z1 * sin_yz;
        double z2 = z1 * cos_yz - y1 * sin_yz;
        double y3 = y2 * cos_yw + w1 * sin_yw;
        double w2 = w1 * cos_yw - y2 * sin_yw;
        double z3 = z2 * cos_zw + w2 * sin_zw;
        double w3 = w2 * cos_zw - z2 * sin_zw;
        vertices[ index ] = vector4( x3, y3, z3, w3 );
    }
}

vector4 const project_to_3d(
    vector4 const &vertex )
{
    vector4 normalized = ~vertex;
    return vector4( normalized.data[ 0 ] / ( normalized.data[ 3 ] + projective_offset ),
                    normalized.data[ 1 ] / ( normalized.data[ 3 ] + projective_offset ),
                    normalized.data[ 2 ] / ( normalized.data[ 3 ] + projective_offset ),
                    1.0 / ( normalized.data[ 3 ] + projective_offset ) );
}

void write_edge(
    ofstream &file,
    int const id,
    vector4 const &from,
    vector4 const &to )
{
    file << "g edge_" << id << endl;
    file << "s " << id << endl;
    static const double two_pi = 6.283185307179586;
    for ( int v_step = 0; v_step <= edge_v_steps; ++v_step )
    {
        double before = static_cast< double >( max( v_step - 1, 0 ) ) / edge_v_steps;
        double v = static_cast< double >( v_step ) / edge_v_steps;
        double after = static_cast< double >( min( v_step + 1, edge_v_steps ) ) / edge_v_steps;
        vector4 position = project_to_3d( lerp( from, to, v ) );
        vector4 tangent = ( project_to_3d( lerp( from, to, before ) ) -
                            project_to_3d( lerp( from, to, after ) ) );
        vector4 offset_x = ~( tangent % position ) * ( edge_radius * position.data[ 3 ] );
        vector4 offset_y = ~( tangent % offset_x ) * ( edge_radius * position.data[ 3 ] );
        for ( int u_step = 0; u_step < edge_u_steps; ++u_step )
        {
            double u = two_pi * u_step / edge_u_steps;
            vector4 corner = ( position +
                               offset_x * cos( u ) +
                               offset_y * sin( u ) ) * scale;
            file << "v " << corner.data[ 0 ]
                 <<  " " << corner.data[ 1 ]
                 <<  " " << corner.data[ 2 ]
                 << endl;
        }
    }
    int count = ( edge_v_steps + 1 ) * edge_u_steps;
    for ( int v_step = 0; v_step < edge_v_steps; ++v_step )
        for ( int u_step = 0; u_step < edge_u_steps; ++u_step )
        {
            int next_u = ( u_step + 1 ) % edge_u_steps;
            file << "f " << ( -count + v_step * edge_u_steps + u_step )
                 <<  " " << ( -count + ( v_step + 1 ) * edge_u_steps + u_step )
                 <<  " " << ( -count + ( v_step + 1 ) * edge_u_steps + next_u )
                 <<  " " << ( -count + v_step * edge_u_steps + next_u )
                 << endl;
        }
}

void write_vertex(
    ofstream &file,
    int const id,
    vector4 const &vertex )
{
    file << "g vertex_" << id << endl;
    file << "s " << id << endl;
    vector4 projected = project_to_3d( vertex );
    static const double pi = 3.141592653589793;
    static const double two_pi = 6.283185307179586;
    for ( int v_step = 0; v_step <= vertex_v_steps; ++v_step )
        for ( int u_step = 0; u_step < vertex_u_steps; ++u_step )
        {
            double u = two_pi * u_step / vertex_u_steps;
            double v = pi * v_step / vertex_v_steps;
            vector4 corner = ( vector4( cos( u ) * sin( v ),
                                        sin( u ) * sin( v ),
                                        cos( v ),
                                        0.0 ) *
                               ( vertex_radius * projected.data[ 3 ] ) +
                               projected ) * scale;
            file << "v " << corner.data[ 0 ]
                 <<  " " << corner.data[ 1 ]
                 <<  " " << corner.data[ 2 ] << endl;
        }
    int count = ( vertex_v_steps + 1 ) * vertex_u_steps;
    for ( int v_step = 0; v_step < vertex_v_steps; ++v_step )
        for ( int u_step = 0; u_step < vertex_u_steps; ++u_step )
        {
            int next_u = ( u_step + 1 ) % vertex_u_steps;
            file << "f " << ( -count + v_step * vertex_u_steps + u_step )
                 <<  " " << ( -count + ( v_step + 1 ) * vertex_u_steps + u_step )
                 <<  " " << ( -count + ( v_step + 1 ) * vertex_u_steps + next_u )
                 <<  " " << ( -count + v_step * vertex_u_steps + next_u )
                 << endl;
        }
}

int main(
    int argc,
    char **argv )
{
    for ( int frame = 0; frame < frames; ++frame )
    {
        cout << "Writing frame " << frame << "..." << endl;
        vector< vector4 > vertices;
        vector< pair< int, int > > edges;
        if ( cells == 8 )
            create_tesseract( vertices );
        else if ( cells == 16 )
            create_16_cell( vertices );
        else if ( cells == 24 )
            create_24_cell( vertices );
        else if ( cells == 120 )
            create_120_cell( vertices );
        compute_edges( edges, vertices );
        rotate_vertices( vertices, static_cast< double >( frame ) / frames );
        ostringstream file_name;
        file_name << "frame" << setw( 3 ) << setfill( '0' ) << frame << ".obj";
        ofstream file( file_name.str().c_str(), ios::out );
        file << "# Vertices: " << vertices.size() << endl;
        file << "# Edges: " << edges.size() << endl;
        for ( int index = 0; index < vertices.size(); ++index )
            write_vertex( file, index, vertices[ index ] );
        for ( int index = 0; index < edges.size(); ++index )
            write_edge( file,
                        index + vertices.size(),
                        vertices[ edges[ index ].first ],
                        vertices[ edges[ index ].second ] );
    }
}


