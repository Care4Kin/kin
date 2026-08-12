const KEY = 'kin_device_id'

// A persistent, per-browser identifier -- independent of login state, so it
// survives logout. Every successful password/phone/Google login (or the
// moment an account is created) registers this device as trusted server-side;
// signing in with just a security question requires a device that's already
// been registered this way, so knowing the answer alone isn't enough to sign
// in from an unrecognized device.
export function getDeviceId() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
