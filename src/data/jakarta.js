import cityMap from '../../data/maps/jakarta.json' with {type:'json'};
import shopMap from '../../data/maps/mixue_shop.json' with {type:'json'};
import {mapSpace} from './mapSpace.js';
const spot = (id,label,kind,x,y,extra={}) => ({id,label,kind,x,y,...extra});
const villager = (id,name,x,y,dx,dy,dialogue,extra={}) => ({
  id,name,x,y,
  dialogue:Array.isArray(dialogue)?{idle:dialogue}:dialogue,
  patrol:(dx||dy)?[{x,y},{x:x+dx,y:y+dy}]:[],
  ...extra
});
export const jakarta = {
  ...mapSpace(cityMap), title:'雅加达街区', subtitle:'JAKARTA', mode:'city',
  start:{x:355,y:238},
  npcs:[
    villager('student','阿妮 · 顾客',145,216,42,0,[
      '喂，你也在等人吗？我跟朋友说在雪王招牌下面见面，这么显眼，应该不会找错吧。',
      '我挺喜欢他们家的冰鲜柠檬水和蜜桃四季春，就是午饭时间有时候要排好久。'
    ],{role:'ambient'}),
    villager('street_office','雷扎 · 午休上班族',254,224,22,0,{
      idle:[
        '午休只剩二十分钟了……旁边咖啡摊有点贵，我还是去买杯冰鲜柠檬水，顺手再带个波霸圣代吧。',
        '不过店里这会儿人多吗？你进去的话，帮我看看柜台前排着几个人？'
      ],
      accepted:['你要是还没进店，路过时帮我看一眼柜台前排了几个人就行。'],
      ready:['柜台前排着三个人？行，时间还赶得上。谢了，我这就过去买。'],
      completed:['三个人还能等。要是排到门口，我大概就回办公室喝白水了。']
    },{role:'side',sprite:'office',portrait:'office'}),
    villager('street_hijab','娜迪亚 · 路过游客',292,236,0,0,[
      '我在这等我朋友，这个标识挺好认的。',
      '我觉得他们家正常糖有点偏甜，待会儿我得点少糖多冰。'
    ],{role:'ambient',sprite:'hijab',portrait:'hijab',facing:2,queue:true}),
    villager('dance_girl','菲娜 · 爱拍视频的姑娘',456,236,0,0,{
      idle:[
        '你好呀！门口的雪王人偶跳得太可爱了，我想跟着《蜜雪冰城甜蜜蜜》和它合拍一段短视频发给朋友！',
        '可是我一个人拿不住手机……方便接过我的手机，帮我们拍一段共舞视频吗？'
      ],
      completed:[
        '刚刚那段共舞视频拍得超有感觉！发给朋友大家都在问这是雅加达哪家蜜雪呢。',
        '要是你还想再拍一条，随时拿我手机重录就行！'
      ]
    },{role:'side',sprite:'dancer',portrait:'dancer',facing:1}),
    villager('vendor','伊布 · 水果摊主',484,230,54,0,[
      '快到中午了，太阳一转过来我就得把水果车往树荫里挪一挪。',
      '对面店里一到午饭点就热闹，有时候不愿排队的客人，也会顺路在我这儿买点芒果和青柠。'
    ],{role:'ambient'}),
    villager('rider','里安 · 骑手',225,378,47,0,[
      '中午这一片冷饮单比较密，珍珠奶茶和波霸圣代点得最多，我就在树荫下等下一单。',
      '刚才路过蜜雪门口，雪王人偶还在跟着音乐扭来扭去，围了好些拍照拍视频的年轻人呢。'
    ],{role:'ambient'}),
    villager('street_auntie','西蒂阿姨 · 街坊',498,386,58,0,[
      '前阵子马路对面还是空铺子，没过多久就开了这家红招牌的冷饮店。'
    ],{role:'ambient',sprite:'auntie',portrait:'auntie'}),
    villager('street_commuter','费迪 · 候车乘客',602,404,0,0,[
      '你也打算去卡拉旺工业园？这边每天都有往返班车，就是早晚高峰出城容易堵一会儿。'
    ],{role:'ambient',sprite:'tech',portrait:'tech',facing:2,queue:true}),
  ],
  interactables:[
    spot('mixue_door','进入蜜雪门店','door',359,204,{to:'mixue_shop',spawn:{x:320,y:266}}),
    spot('mixue_sign','查看门店招牌','inspect',318,218,{text:'红底白字的 MIXUE 招牌配雪王立在街角，隔着马路也能一眼认出来。'}),
    spot('snowking_mascot','跳舞的雪王人偶','dance_mascot',426,232,{text:'雪王人偶举着冰淇淋权杖，正踩着《蜜雪冰城甜蜜蜜》的欢快节拍左右摇摆！旁边的姑娘菲娜正想找人帮她拍一段共舞视频。'}),
    spot('coffee_board','咖啡摊的小黑板','inspect',112,208,{text:'小黑板上写着街边咖啡摊的日常冰美式与棕榈糖拿铁，午后阳光把粉笔字晒得暖洋洋的。'}),
    spot('fruit','水果手推车','inspect',528,217,{text:'彩条车篷下摆着山竹、芒果和青柠，摊主把熟果推到了阴凉一侧。'}),
    spot('halte','搭车前往卡拉旺','transport',675,413,{to:'karawang'}),
    spot('bench','树荫下的长椅','inspect',291,429,{text:'树荫下的木长椅正好对着街角门店，坐在这儿能清楚看见人流和红招牌。'}),
  ],
};
export const mixue_shop = {
  ...mapSpace(shopMap),title:'蜜雪冰城门店',subtitle:'MIXUE STORE',mode:'interior',
  start:{x:320,y:266},limits:{left:164,right:476,top:128,bottom:298},
  npcs:[
    villager('clerk','莉娜 · 取餐台店员',276,152,32,0,{
      idle:[
        '你好，这边是取餐台！午高峰刚上来，饮品配甜筒、圣代的套餐单一下排了好几张。',
        '你要不要体验一轮蜜雪店员？站到左柜台前按 E，对照顾客小票配齐饮品、冰糖和甜品，连出 3 份套餐就行！'
      ],
      accepted:['左柜台就是店员操作台，按 E 可以按顾客订单调配饮品加冰调糖，再配上甜筒或圣代端上托盘。'],
      completed:['刚才那轮 3 份套餐出得真利索！谢了，午高峰轻松不少，想再挑战满分随时欢迎再去吧台帮忙。']
    },{role:'main'}),
    villager('cashier','菲菲 · 点单收银员',392,152,0,0,{
      idle:[
        '您好，这边点单，左边取餐。我们不只卖甜筒（8,000 盾）和冰鲜柠檬水（10,000 盾），波霸圣代、草莓果茶、蜜桃四季春和黑糖珍珠奶茶都很受欢迎。',
        '中午单子比较密，麻烦稍微排一下队，头顶菜单屏上都标着价格。'
      ],
      completed:['左边刚出了一杯新单，队伍往前挪了一点。下一位请点单，甜筒、圣代、果茶还是珍珠奶茶？']
    },{role:'main',sprite:'clerk',portrait:'clerk',facing:0,queue:true}),
    villager('queue_hijab','莎拉 · 排队顾客',406,204,0,0,[
      '轮到我了，准备点一杯蜜桃四季春，少糖多冰。大热天走过来，就想喝口带果香清爽解渴的。'
    ],{role:'ambient',sprite:'hijab',portrait:'hijab',facing:3,queue:true}),
    villager('customer','巴古斯 · 排队白领',409,237,0,0,[
      '午休出来透口气。今天想换换口味点杯黑糖珍珠奶茶，这家价格在写字楼附近算便宜的，就是中午排队有点耗时间。'
    ],{role:'ambient',sprite:'office',portrait:'office',facing:3,queue:true}),
    villager('queue_auntie','玛丽亚阿姨 · 排队顾客',405,270,0,0,[
      '帮家里两个孩子带波霸圣代和草莓果茶，再给自己买杯柠檬水。要不是离家近、价钱合适，排这么长的队我还真懒得等。'
    ],{role:'ambient',sprite:'auntie',portrait:'auntie',facing:3,queue:true}),
    villager('table_student','蒂娜 · 堂食顾客',224,234,0,0,[
      '点了个芒果圣代配椰果奶茶，店里座位不多，刚好空出这张圆桌，进来吹会儿冷气慢慢吃。'
    ],{role:'ambient',sprite:'student',portrait:'student',facing:1,queue:true}),
    villager('shop_rider','阿迪 · 等餐骑手',244,274,0,0,[
      '好长的队啊，到底什么时候才出餐？'
    ],{role:'ambient',sprite:'rider',portrait:'rider',facing:3,queue:true}),
  ],
  interactables:[
    spot('order_counter','体验蜜雪店员 · 套餐台','minigame',264,196,{task:'mixue_order'}),
    spot('mixue_menu','查看柜台与菜单屏','inspect',380,196,{text:'头顶亮着三联菜单屏，吊牌分出左侧取餐（COLLECT）和右侧点单（ORDER HERE），涵盖冰淇淋圣代、鲜果茶饮与经典奶茶三大系列。'}),
    spot('supply_box','补货纸箱','inspect',458,196,{text:'柜台边摞着两箱杯子和吸管，交班本上记着下午两点前需补一次包材。'}),
    spot('mixue_exit','返回雅加达街区','door',320,292,{to:'jakarta',spawn:{x:359,y:222}}),
  ],
};
