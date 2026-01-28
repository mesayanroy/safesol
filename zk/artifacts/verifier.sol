// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 3487750289419669175832210823587108075464664425086469139824929251311684698582;
    uint256 constant alphay  = 5881838236434228028632919716897525718235900937338799134619318732773959895706;
    uint256 constant betax1  = 20152496653819567391085588708224983972097745160735525608178777030211279140258;
    uint256 constant betax2  = 6280370198270784111171494354022155152582357164630802926225773006233925429810;
    uint256 constant betay1  = 1669585762517928130256559020118169006436964015972681678137452538144696774826;
    uint256 constant betay2  = 16082162002846231700413672652638169526217318127790360152566580862703701109553;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 7401358801274846126052902083241709839018311551393271309689059253078708937134;
    uint256 constant deltax2 = 6189105671683434781483176592499978049728673824309434388183612936548559758610;
    uint256 constant deltay1 = 1466937478345383435063373189881917489709209171972135288096733255894292313963;
    uint256 constant deltay2 = 16954420087420925902223122990862288469994557442293311925832974028928381051798;

    
    uint256 constant IC0x = 5345789592948354639614884966219297240498507865753779559653921724292705510300;
    uint256 constant IC0y = 326633444456561843230095074549620313793611270134334137399471759247560963207;
    
    uint256 constant IC1x = 180417447845815699713494635290823260059959006142154021691301031770491206057;
    uint256 constant IC1y = 19121526996296587288611431739941871411341093954024417580474350264731185022401;
    
    uint256 constant IC2x = 21624003332495849632936525374335418962346152101031845860601343620783395729831;
    uint256 constant IC2y = 7074573739862442496175905713954541424692534508851401573208026187807344127672;
    
    uint256 constant IC3x = 4511304562054763005226885749996481749093771377014036994036995879423391619782;
    uint256 constant IC3y = 3265645201615362036143023031697429185445537431001051879884875387825152028510;
    
    uint256 constant IC4x = 4681806397670677998264329534487117118573385989412979755532939703468705390778;
    uint256 constant IC4y = 3778204163184104444893274690497519693620965027398964532562397399835824512958;
    
    uint256 constant IC5x = 8778499277128007222381500363242441198034859663511717638756707466982245891657;
    uint256 constant IC5y = 3632891170134724785424838301159067489097324918125006931311186796730008950982;
    
    uint256 constant IC6x = 13788710550444044648174109675294219120747098351338368786929542362704825964016;
    uint256 constant IC6y = 16579208920925127350223623447996661052737304224703035764222968975602483541475;
    
    uint256 constant IC7x = 2515361364430286718496230833567727415117041076767030630468337673870640875081;
    uint256 constant IC7y = 10244889101390095143648411134339380783486207258166683328569974492052118562929;
    
    uint256 constant IC8x = 4594692567624737109658373695586080570426335786945517203501895158726379934333;
    uint256 constant IC8y = 11026433025294907861051655982309741304475362422508077368973294667100525560302;
    
    uint256 constant IC9x = 18065977304100151781840497418044215835449497677567538378026860394071185324573;
    uint256 constant IC9y = 16074872502779751752582638743521180519763252391640090229840612394454088235058;
    
    uint256 constant IC10x = 6733021747110403259613746007460416905065918150511760741201066158282370229631;
    uint256 constant IC10y = 20363233165142671505734287834040690196266161419156020010522936096087394357939;
    
    uint256 constant IC11x = 6616094177610450195465668780381919475947560096889512415381062836002243655256;
    uint256 constant IC11y = 19288258405646395964547476667522332622555364956692599447445118717206009696885;
    
    uint256 constant IC12x = 8658905636087016706496553847517664701206420752895439031079190147909016567316;
    uint256 constant IC12y = 11855971178407670028960936852877168156665222394059752683090208577209605652786;
    
    uint256 constant IC13x = 16891077984957705405815342684400429769223884210929738407084113836707308215013;
    uint256 constant IC13y = 7009574886987507297487896392354913299872885750928467034352146708348348214303;
    
    uint256 constant IC14x = 14593800805530418616753548168290314773834330867058477197206975209175289628903;
    uint256 constant IC14y = 14872205054860530632151534952921954656351482606187041141662419233949566416575;
    
    uint256 constant IC15x = 6813883588529772497572399583724041144291897039513892823654251308584332234174;
    uint256 constant IC15y = 12795575757928984054919640652696844295276055459734861575713233162209057864873;
    
    uint256 constant IC16x = 1611369974667487184720332645825714769842703716597445700961158304548640976577;
    uint256 constant IC16y = 7490978146823416286126516661501409065196613660049643741016594525602812827867;
    
    uint256 constant IC17x = 6460889170943386625767474918120494381805707480603014951762771587100345816890;
    uint256 constant IC17y = 2358365834580809559251047636750403675179880501961137900003964840975631856304;
    
    uint256 constant IC18x = 13375380012030107411885804019086229874155240129076222967234914659047126443916;
    uint256 constant IC18y = 7911946617951811539927470046931455139165841355488991204133533008783069230536;
    
    uint256 constant IC19x = 17370868820563006256969718771466687027680511560941550224517738625808302805214;
    uint256 constant IC19y = 16763086288077750005920440147951899290967035439127582325896494340369805572802;
    
    uint256 constant IC20x = 12966564403277040438266705414546720018194172662651040132065164153045405625344;
    uint256 constant IC20y = 11722465511529639276675676741119742239838159068704834607866907268941649478890;
    
    uint256 constant IC21x = 6107972091148187908920238956177095678640151302252581309996080387571925822025;
    uint256 constant IC21y = 3123466585465097653576600740909693747235603124084677548067779196094139485376;
    
    uint256 constant IC22x = 11097833714983930021824259169769236991149841235413612362250509741747125141350;
    uint256 constant IC22y = 19286966502867625760465983843888670628795205707812507284917558476430131017697;
    
    uint256 constant IC23x = 5607982177541447475307329860351448573247298491950483971513951636443350097490;
    uint256 constant IC23y = 3407689823430546826861688966095108407451298530456293454585664968922063211;
    
    uint256 constant IC24x = 9075879541055371633755593425793085570413687574192669429923885128454888356019;
    uint256 constant IC24y = 4325090528852815503501668876311724187581264388581316865373470515119953803863;
    
    uint256 constant IC25x = 19997546602856324421713788130630712380894652138550144882870071911663805804451;
    uint256 constant IC25y = 11165802693902537470976844880419240143153148502333772759091410727156035109202;
    
    uint256 constant IC26x = 20399045064804145230681772268480806467465599043927116873719864254716824058457;
    uint256 constant IC26y = 19312315016539504085610537176448737950626986417226178242403967955497258564582;
    
    uint256 constant IC27x = 8429830804053281357723546750684059930741054569019316972826697919998867659907;
    uint256 constant IC27y = 16606921376539367596423787941467457834856810724711193565912246615982975454005;
    
    uint256 constant IC28x = 19050647521948827472491641674847659052270244402626807547720583895063431275921;
    uint256 constant IC28y = 20766109251235217900939436742018655541098176082176045813247618589376894854019;
    
    uint256 constant IC29x = 5974026873270272779737599050971129761850474980093726319966453635395097728604;
    uint256 constant IC29y = 1340984225319068389544094826361299349464099714600424839968462858074336187927;
    
    uint256 constant IC30x = 21635576674578722464971166906259803986877769402495969824691497006519008047629;
    uint256 constant IC30y = 2941085227840449545157847782944393534147916658982066584569406999671618913947;
    
    uint256 constant IC31x = 17335381499907282175740211271835338403633247915362363678599749435519505962090;
    uint256 constant IC31y = 15335080618607863260457997691830291074088130780712511682134146604652834047920;
    
    uint256 constant IC32x = 6718869028269666180452177669986866851164826857738883045635161465668959497602;
    uint256 constant IC32y = 15173888085054615674756157139680041461074928384033850213576047738747264533103;
    
    uint256 constant IC33x = 7033298441323208704350026473240849572264540519675814285417990372010443187669;
    uint256 constant IC33y = 6387022698997494740085527476656826984691967007591159691726032168152887712788;
    
    uint256 constant IC34x = 7369512362099395077880284917405804307880286421900087611388975847199551541367;
    uint256 constant IC34y = 10376414812762681448915957213640658890270177151470837043449028342198419025063;
    
    uint256 constant IC35x = 13554395236679702318125963466362555896948887923873379262641335044529083718503;
    uint256 constant IC35y = 17337488826465696117368606894564798364751855970643811752061012513157521068090;
    
    uint256 constant IC36x = 13255643985767525091681317193963391749764286282434065333393844380254432465752;
    uint256 constant IC36y = 14982421445172502032439440508105447725475287783945514503397142241559771801520;
    
    uint256 constant IC37x = 12030883963350893787514902289567579300775079307735809931246769259663110320297;
    uint256 constant IC37y = 21699990147524592469531032064860754668116455447871468420064063051220275998033;
    
    uint256 constant IC38x = 12018456194026206470371076666760892304024603903189604821927341664210745974366;
    uint256 constant IC38y = 12250284741826531952398388155795731155890751378414538212639978757001707997584;
    
    uint256 constant IC39x = 1575994177653504709305275178125767406826350467962183394424878439826335699488;
    uint256 constant IC39y = 10318921305716007347509756430337857788457266204360166084800431448499916170658;
    
    uint256 constant IC40x = 19793737720596147110351361420270387943899050107616115192785973147346050962335;
    uint256 constant IC40y = 10975863791293675708692599175094871598157861740654381206807879193036737981818;
    
    uint256 constant IC41x = 16966825112614769369570033610818551562497743731221948148505419953121040010208;
    uint256 constant IC41y = 6220718889013280074048492197216255830742215347696880501098960188863346982491;
    
    uint256 constant IC42x = 16284245444721250896150102262936323052932817515877502742318440830037501707448;
    uint256 constant IC42y = 14519493248031508993983642344137706022405593046803279204493964151678447969429;
    
    uint256 constant IC43x = 21830233996625620424349484978660879369192256979422185658052627732082219744596;
    uint256 constant IC43y = 9744976367377013714284970355360077583030390136247593819016517191518952401385;
    
    uint256 constant IC44x = 13890245626129917966732903932863540249786021089860230216962091469780485632812;
    uint256 constant IC44y = 12923654108996674650849462004427066037119684577016449548744648771688589182118;
    
    uint256 constant IC45x = 5422718666710650244954803341668085861796225161254984871635962008196515618072;
    uint256 constant IC45y = 1708659805868370938373989559312929955032753607199367998640035705729826928496;
    
    uint256 constant IC46x = 16966807970992048708863482869934061574640522529763587736690754986760504965932;
    uint256 constant IC46y = 589623682002795090736531709668265963146738672954040593028133931702242595685;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[46] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
