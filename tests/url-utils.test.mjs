import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePublicUrl,isPublicIp,sameOriginPage,fileSlug} from '../src/url-utils.mjs';
test('allows normal HTTPS but rejects unsafe scheme and credential URLs',()=>{
  assert.equal(parsePublicUrl('https://example.com/').href,'https://example.com/');
  assert.throws(()=>parsePublicUrl('file:///etc/passwd'));
  assert.throws(()=>parsePublicUrl('https://admin:secret@example.com/'));
  assert.throws(()=>parsePublicUrl('https://example.com:8080/'));
});
test('blocks private IP ranges',()=>{
  for(const ip of ['127.0.0.1','10.0.0.1','192.168.1.1','169.254.10.1','172.16.0.1','::1','fc00::1','::ffff:127.0.0.1'])assert.equal(isPublicIp(ip),false,ip);
  for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(isPublicIp(ip),true,ip);
});
test('only traverses same-origin HTML pages',()=>{
  const root=parsePublicUrl('https://example.com');
  assert.equal(sameOriginPage('https://example.com/products?src=ads#faq',root),'https://example.com/products');
  assert.equal(sameOriginPage('https://bad.example.com/',root),null);
  assert.equal(sameOriginPage('https://example.com/logo.png',root),null);
  assert.equal(sameOriginPage('https://example.com/logout',root),null);
  assert.equal(fileSlug('https://example.com/foo',2),'03-foo');
});
