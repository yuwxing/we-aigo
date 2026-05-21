const https = require('https');

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

const deals = [
  {title:'【加油】吕梁汽油促消费',desc:{type:'offline',category:'加油优惠',merchant:'云闪付',icon:'⛽',discount:'满100减15',saveAmount:'45元封顶',validUntil:'2026-05-21',region:'山西吕梁',url:'https://yunshanfu.com'},budget:45},
  {title:'【加油】吉林全球通中石油',desc:{type:'offline',category:'加油优惠',merchant:'中石油',icon:'⛽',discount:'92号95折',saveAmount:'省0.2元/升',validUntil:'2026-05-31',region:'吉林省',url:'https://www.10086.cn'},budget:10},
  {title:'【加油】中石化易捷周五抢券',desc:{type:'offline',category:'加油优惠',merchant:'中石化',icon:'⛽',discount:'每周五10点抢券',saveAmount:'券包50+',validUntil:'2026-05-31',region:'全国',url:'https://www.sinopec.com'},budget:50},
  {title:'【停车】高德免费找车位',desc:{type:'offline',category:'停车优惠',merchant:'高德地图',icon:'🅿️',discount:'筛选免费车位',saveAmount:'每月省200+',validUntil:'长期有效',region:'全国',url:'https://www.amap.com'},budget:200},
  {title:'【停车】美团1小时免费停车',desc:{type:'offline',category:'停车优惠',merchant:'美团',icon:'🅿️',discount:'每周领1小时免费券',saveAmount:'每月省576元',validUntil:'长期有效',region:'全国',url:'https://www.meituan.com'},budget:576},
  {title:'【餐饮】麦当劳套餐优惠',desc:{type:'offline',category:'实体店券',merchant:'麦当劳',icon:'🍔',discount:'炸鸡桶20元起',saveAmount:'低至5折',validUntil:'2026-05-31',region:'全国门店',url:'https://www.mcdonalds.com.cn'},budget:15},
  {title:'【餐饮】肯德基早餐13.9元起',desc:{type:'offline',category:'实体店券',merchant:'肯德基',icon:'🍗',discount:'早餐13.9元起',saveAmount:'专属价',validUntil:'2026-05-31',region:'全国门店',url:'https://www.kfc.com.cn'},budget:10},
  {title:'【餐饮】邮储信用卡肯德基5折',desc:{type:'offline',category:'实体店券',merchant:'肯德基',icon:'🍗',discount:'周六25元券5折',saveAmount:'最高省25元',validUntil:'2026-07-31',region:'全国门店',url:'https://www.psbc.com'},budget:25},
  {title:'【会员】爱奇艺VIP月卡21元',desc:{type:'online',category:'大厂会员',merchant:'爱奇艺',icon:'🎬',discount:'会员价21元',saveAmount:'省9元',validUntil:'长期有效',region:'线上',url:'https://vip.iqiyi.com'},budget:9},
  {title:'【会员】QQ音乐绿钻14.5元',desc:{type:'online',category:'大厂会员',merchant:'QQ音乐',icon:'🎵',discount:'会员价14.5元',saveAmount:'省3.5元',validUntil:'长期有效',region:'线上',url:'https://y.qq.com'},budget:3.5},
  {title:'【会员】B站大会员17.5元',desc:{type:'online',category:'大厂会员',merchant:'B站',icon:'📺',discount:'会员价17.5元',saveAmount:'省7.5元',validUntil:'长期有效',region:'线上',url:'https://www.bilibili.com'},budget:7.5},
  {title:'【会员】网易云黑胶VIP14.5元',desc:{type:'online',category:'大厂会员',merchant:'网易云',icon:'🎧',discount:'会员价14.5元',saveAmount:'省3.5元',validUntil:'长期有效',region:'线上',url:'https://music.163.com'},budget:3.5},
  {title:'【充值】话费8.5折',desc:{type:'online',category:'充值优惠',merchant:'高省APP',icon:'📱',discount:'话费8.5折',saveAmount:'充100省15',validUntil:'长期有效',region:'线上',url:'https://www.gaoersheng.cn'},budget:15},
  {title:'【充值】话费8.3折',desc:{type:'online',category:'充值优惠',merchant:'直返APP',icon:'📱',discount:'话费8.3折+返利',saveAmount:'充100省17+',validUntil:'长期有效',region:'线上',url:'https://zhifan.asia'},budget:17},
  {title:'【电商】京东红包福利333',desc:{type:'online',category:'电商优惠券',merchant:'京东',icon:'🛒',discount:'搜索福利333',saveAmount:'红包抵扣',validUntil:'长期有效',region:'线上',url:'https://www.jd.com'},budget:20},
  {title:'【电商】京东618每天红包',desc:{type:'online',category:'电商优惠券',merchant:'京东',icon:'🛒',discount:'搜索每天红包',saveAmount:'最高26618',validUntil:'2026-06-18',region:'线上',url:'https://www.jd.com'},budget:100},
  {title:'【电商】淘宝618补贴',desc:{type:'online',category:'电商优惠券',merchant:'淘宝',icon:'🛍️',discount:'搜索补贴快点来',saveAmount:'红包抵扣',validUntil:'2026-06-20',region:'线上',url:'https://www.taobao.com'},budget:50},
  {title:'【电商】京东国补最高1500',desc:{type:'online',category:'电商优惠券',merchant:'京东',icon:'🏠',discount:'搜索国补333',saveAmount:'最高1500元',validUntil:'2026-06-18',region:'线上',url:'https://www.jd.com'},budget:1500}
];

function insertDeal(deal) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      title: deal.title,
      description: JSON.stringify(deal.desc),
      status: 'deal',
      budget: deal.budget,
      publisher_id: 1
    });
    
    const options = {
      hostname: 'mzjmfyoemcsoqzoooiej.supabase.co',
      port: 443,
      path: '/rest/v1/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('开始写入数据...');
  for (let i = 0; i < deals.length; i++) {
    try {
      await insertDeal(deals[i]);
      console.log(`✓ ${i+1}/${deals.length}: ${deals[i].title}`);
    } catch (e) {
      console.error(`✗ ${i+1}: ${deals[i].title} - ${e.message}`);
    }
  }
  console.log('\n✅ 数据写入完成，共' + deals.length + '条');
}

main().catch(console.error);
