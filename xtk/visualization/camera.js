/*
 * ${HEADER}
 */

// provides
goog.provide('X.camera');

// requires
goog.require('X.base');
goog.require('X.exception');
goog.require('goog.math.Matrix');
goog.require('goog.math.Vec3');

/**
 * Create a camera.
 *
 * @constructor
 * @extends {X.base}
 */
X.camera = function(renderer) {

  // call the standard constructor of X.base
  goog.base(this);

  if (!renderer) {

    throw new X.exception(
        'Fatal: A valid renderer is required to create a camera.');

  }

  //
  // class attributes

  /**
   * @inheritDoc
   * @const
   */
  this._className = 'camera';

  this._renderer = renderer;

  this._perspective = this.calculatePerspective_(45,
      (this._renderer.getWidth() / this._renderer.getHeight()), 1, 10000);

  this._view = this.lookAt_(new goog.math.Vec3(0, 0, 100), new goog.math.Vec3(
      0, 0, 0), new goog.math.Vec3(0, 1, 0));

};
// inherit from X.base
goog.inherits(X.camera, X.base);

/**
 *
 */
X.camera.prototype.getPerspective = function() {

  return this._perspective;

};

X.camera.prototype.getView = function() {

  return this._view;

};

//
// gluPerspective
//
// fovy: Field of view in degrees
// aspect: aspect ratio width/height
// znear: near clipping plane
// zfar: far clipping plane
/**
 *
 */
X.camera.prototype.calculatePerspective_ = function(fieldOfViewY, aspectRatio,
    zNearClippingPlane, zFarClippingPlane) {

  var ymax = zNearClippingPlane * Math.tan(fieldOfViewY * Math.PI / 360.0);
  var ymin = -ymax;
  var xmin = ymin * aspectRatio;
  var xmax = ymax * aspectRatio;

  return this.calculateViewingFrustum_(xmin, xmax, ymin, ymax,
      zNearClippingPlane, zFarClippingPlane);

};

//
// glFrustum
//
// creates the 3d view area which is visible to the viewer, to check if objects
// are visible
// see http://en.wikipedia.org/wiki/Viewing_frustum
/**
 *
 */
X.camera.prototype.calculateViewingFrustum_ = function(left, right, bottom,
    top, znear, zfar) {

  var X = 2 * znear / (right - left);
  var Y = 2 * znear / (top - bottom);
  var A = (right + left) / (right - left);
  var B = (top + bottom) / (top - bottom);
  var C = -(zfar + znear) / (zfar - znear);
  var D = -2 * zfar * znear / (zfar - znear);

  return new goog.math.Matrix([ [ X, 0, A, 0 ], [ 0, Y, B, 0 ], [ 0, 0, C, D ],
      [ 0, 0, -1, 0 ] ]);

};

X.camera.prototype.lookAt_ = function(cameraPosition, targetPoint, up) {

  if (!(cameraPosition instanceof goog.math.Vec3)
      || !(targetPoint instanceof goog.math.Vec3)
      || !(up instanceof goog.math.Vec3)) {

    throw new X.exception(
        'Fatal: 3D vectors required for calculating the view.');

  }

  var matrix = goog.math.Matrix.createIdentityMatrix(4);

  // Make rotation matrix

  // Z vector = cameraPosition - targetPoint
  var zVector = goog.math.Vec3.difference(cameraPosition, targetPoint);

  // normalize Z
  zVector.normalize();

  // Y vector = up
  var yVector = up.clone();

  // X vector = Y x Z
  var xVector = goog.math.Vec3.cross(yVector, zVector);

  // recompute Y vector = Z x X
  yVector = goog.math.Vec3.cross(zVector, xVector);

  // normalize X and Y
  xVector.normalize();
  yVector.normalize();

  // create view matrix
  matrix.setValueAt(0, 0, xVector.x);
  matrix.setValueAt(0, 1, xVector.y);
  matrix.setValueAt(0, 2, xVector.z);
  matrix.setValueAt(0, 3, 0);

  matrix.setValueAt(1, 0, yVector.x);
  matrix.setValueAt(1, 1, yVector.y);
  matrix.setValueAt(1, 2, yVector.z);
  matrix.setValueAt(1, 3, 0);

  matrix.setValueAt(2, 0, zVector.x);
  matrix.setValueAt(2, 1, zVector.y);
  matrix.setValueAt(2, 2, zVector.z);
  matrix.setValueAt(2, 3, 0);

  matrix.setValueAt(3, 0, 0);
  matrix.setValueAt(3, 1, 0);
  matrix.setValueAt(3, 2, 0);
  matrix.setValueAt(3, 3, 1);

  return matrix.translate(cameraPosition.invert());

};
