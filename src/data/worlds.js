import {jakarta,mixue_shop} from './jakarta.js';
import {mapSpace} from './mapSpace.js';
import yard from '../../data/maps/karawang.json' with {type:'json'};
import workshop from '../../data/maps/sany_workshop.json' with {type:'json'};

const spot=(id,label,kind,x,y,extra={})=>({id,label,kind,x,y,...extra});
const patrol=(x,y,toX,toY)=>[{x,y},{x:toX,y:toY}];

export const WORLDS={
  jakarta,mixue_shop,
  karawang:{
    ...mapSpace(yard),title:'卡拉旺 · 三一产业园',mode:'factory',start:{x:291,y:220},
    vehicles:[
      {id:'karawang_scooter',key:'scooter',x:236,y:382,label:'骑上园区电动车',featured:true}
    ],
    npcs:[
      {id:'documentarian',role:'main',name:'万老师 · 现场影像记录者',x:357,y:211,patrol:patrol(357,211,381,219),dialogue:{}},
      {id:'engineer',role:'main',name:'服务工程师',x:605,y:201,patrol:patrol(605,201,632,201),dialogue:{
        idle:[
          '前面卷帘门进去就是服务车间。我们一直讲“No More Waiting”，就是要尽量减少客户停机等待——刚到了一车重型备件，工地设备等着换件，卸货入位可不能马虎。',
          '你可以进车间西侧龙门吊控制台按 E，亲自操作行车把 A1、B2、C1 三箱备件稳稳吊放到对应货位，再去东侧交接签收。'
        ],
        accepted:['龙门吊控制台在车间西侧，操作行车抓起货车上的三箱备件，平稳落位到对应编号货位就行。'],
        completed:['K-07 三箱重型备件都稳稳卸货签收完了，接下来就等物流发往工地。把承诺开到现场，真正修好复工前我们都不算收工。']
      }},
      {id:'guide',role:'main',name:'迪安 · 接待员',x:207,y:342,patrol:patrol(207,342,251,337),dialogue:{
        idle:[
          '欢迎来到西爪哇卡拉旺 KIM 产业园！这里是三一在海外落地的首座“灯塔工厂”，一期主打挖掘机本地装配，2022 年首台本地组装挖机就在这儿下线，2023 年又启动了二期扩建。',
          '除了整机生产和本地技师实训，园区也承担周边工地的售后与备件供应。过斑马线往北是主厂房和展机区，再往东是服务车间，参观请在黄线外走动。'
        ]
      }},
      {id:'contractor_boss',role:'side',name:'亨德拉 · 工程承包商',x:526,y:216,sprite:'boss',portrait:'boss',facing:3,queue:true,dialogue:{
        idle:[
          '这台挖机看着不错。不过买设备不是买玩具，报价只是第一步。',
          '我更想知道，如果机器在工地上突然停了，谁负责，多久能处理？'
        ],
        completed:['备件核对得不错。至于要不要采购，我还想看看你们在其他矿区或工程里可核查的实际服务记录和出勤表现。']
      }},
      {id:'park_trainee',role:'ambient',name:'普特拉 · 实训技师',x:98,y:218,sprite:'tech',portrait:'tech',patrol:patrol(98,218,128,218),dialogue:{
        idle:['刚从园区培训中心出来。三一在印尼设了本地技师培训项目，这周我们在练故障码排查和日常保养。']
      }},
      {id:'park_driver',role:'ambient',name:'巴尤 · 配件物流调度',x:368,y:344,sprite:'office',portrait:'office',patrol:patrol(368,344,444,344),dialogue:{
        idle:['车间核对完的急件会先转到待配送区，由我们按路线装车发往周边工地，遇上高速堵车也挺头疼。'],
        completed:['K-07 已经转入待配送区了，我核对完发车单就准备送往工地。']
      }}
    ],
    interactables:[
      spot('sany_sign','厂房与 SANY 字标','evidence',253,184,{key:'sany_sign',fact:'sany_indonesia_park',photoFrame:[68,38,252,144]}),
      spot('sany_excavator','履带展机','evidence',434,203,{key:'sany_machine',fact:'sany_indonesia_park',photoFrame:[321,94,224,128]}),
      spot('workshop_door','进入服务车间','door',690,185,{to:'sany_workshop'}),
      spot('transport_back','搭车返回雅加达','transport',121,374,{to:'jakarta'}),
      spot('sany_building_door','参观登记处','inspect',163,184,{text:'前台登记本夹着访客证，分别标着室外展机区和东侧服务车间。提示牌写着参观请保持在黄线外。'}),
      spot('pallet','待接收货箱','inspect',701,364,{text:'送货平板车刚把这批 K-07 重型备件拉进东侧服务车间。进车间西侧龙门吊控制台按 E，就可以亲自操作三一行车把备件卸货入位。'})
    ]
  },
  sany_workshop:{
    ...mapSpace(workshop),title:'服务车间',mode:'interior',start:{x:317,y:303},
    limits:{left:40,right:602,top:82,bottom:343},
    npcs:[
      {id:'service_tech',role:'main',name:'服务协调员',x:522,y:259,patrol:patrol(522,259,543,259),dialogue:{
        blocked:['这边是东侧交接区。先去西侧龙门吊控制台按 E，把货车上的三箱备件卸货入位再过来签收。'],
        completed:['K-07 三件备件已完成龙门吊卸货签收并转入待配送区，记录贴在东侧交接板上。']
      }},
      {id:'warehouse_keeper',role:'side',name:'瓦尤 · 仓管技师',x:336,y:134,sprite:'tech',portrait:'tech',patrol:patrol(336,134,376,134),dialogue:{
        idle:['车间里装了三一龙门吊，货位按编号分好：A1 密封件、B2 滤芯、C1 液压阀。吊装时稳住摆动别放错区就行。'],
        completed:['A1、B2、C1 三箱重型备件都由龙门吊稳稳落位，入库账目全都对上了！']
      }},
      {id:'waiting_boss',role:'side',name:'鲁迪 · 工地采购代表',x:468,y:316,sprite:'boss',portrait:'boss',facing:3,queue:true,dialogue:{
        idle:['我来跟进 K-07 那车重型备件。工地有台设备等着换密封件、滤芯和液压阀，就盼着这边尽快卸货出库。'],
        accepted:['货车已经进位了，西侧龙门吊正准备吊装卸货，液压阀那箱比较娇贵，记得轻拿轻放啊。'],
        completed:['三箱配件总算稳稳卸货签收转入待配送了。等车送到工地装上试机，这次先看看实际响应速度怎么样。']
      }}
    ],
    interactables:[
      spot('parts_shelf','龙门吊控制台 · 备件卸货','minigame',96,235,{task:'sany_service'}),
      spot('rack_a1','货架 A1 · 密封件箱','rack',216,157,{slot:'A1'}),
      spot('rack_b2','货架 B2 · 滤芯箱','rack',439,205,{slot:'B2'}),
      spot('rack_c3','货架 C3 · 标签纸箱','rack',210,268,{slot:'C3'}),
      spot('service_log','交接记录板','evidence',552,233,{key:'sany_service_record',fact:'brand_logic_sany',photoFrame:[442,134,182,104]}),
      spot('workshop_exit','返回卡拉旺园区','door',317,332,{to:'karawang',spawn:{x:690,y:207}})
    ]
  }
};
