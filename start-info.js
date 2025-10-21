const os = require('os');

console.log('\n🚀 Starting Society 360 - Smart Society Management Platform...\n');

// Get network interfaces
const networkInterfaces = os.networkInterfaces();
const networkIPs = [];

Object.keys(networkInterfaces).forEach(interfaceName => {
  const addresses = networkInterfaces[interfaceName];
  addresses.forEach(address => {
    if (address.family === 'IPv4' && !address.internal) {
      networkIPs.push(address.address);
    }
  });
});

console.log('📋 Access URLs:');
console.log('');
console.log('🖥️  Local Development:');
console.log('   Frontend: http://localhost:5173');
console.log('   Backend:  http://localhost:5000');
console.log('');

if (networkIPs.length > 0) {
  console.log('🌐 Network Access (for other devices):');
  networkIPs.forEach(ip => {
    console.log(`   Frontend: http://${ip}:5173`);
    console.log(`   Backend:  http://${ip}:5000`);
  });
  console.log('');
}

console.log('👨‍💼 Admin Login:');
console.log('   Username: watchman');
console.log('   Password: watchman123');
console.log('');

console.log('👥 Sample Residents:');
console.log('   Username: john_doe, jane_smith, mike_wilson, etc.');
console.log('   Password: password123');
console.log('');

console.log('📱 Perfect for demos! Other devices on your network can access these URLs.');
console.log('🔧 Make sure your firewall allows connections on ports 5173 and 5000.');
console.log('');
